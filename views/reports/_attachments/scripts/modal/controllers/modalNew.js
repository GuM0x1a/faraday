angular.module('faradayApp')
    .controller('modalNewCtrl',
        ['$scope', '$modalInstance', '$filter', '$upload', 'targetFact', 'commonsFact', 'severities', 'workspace',
        function($scope, $modalInstance, $filter, $upload, targetFact, commons, severities, workspace) {
        
        $scope.typeOptions = [
            {name:'Vulnerability', value:'Vulnerability'},
            {name:'VulnerabilityWeb',value:'VulnerabilityWeb'}
        ];

        $scope.vuln_type = $scope.typeOptions[0].value;
        $scope.severities = severities;
        $scope.workspace = workspace;
        $scope.target_selected = null;
        $scope.not_target_selected = false;
        $scope.incompatible_vulnWeb = false;
        $scope.refs = [{ref:''}];
        $scope.evidence = {};
        $scope.icons = {};
        $scope.showPagination = 1;
        $scope.currentPage = 0;
        $scope.pageSize = 5;
        $scope.pagination = 10;
        $scope.file_name_error = false;

        var name_selected,
        host_selected,
        d = {},
        hosts = targetFact.getTarget($scope.workspace, true);

        hosts.forEach(function(h) {
            h.services = [];  
            d[h._id] = h;
        });

        var services = targetFact.getTarget($scope.workspace, false);

        for(var i = 0; i < services.length; i++){
            var host = [];
            services[i].selected = false;
            host = d[services[i].hid];
            host.services.push(services[i]);
        }

        $scope.hosts_with_services = hosts;

        $scope.numberOfPages=function(){
            var filteredData = $filter('filter')($scope.hosts_with_services,$scope.search_notes);
            if (filteredData.length <= 10){
                $scope.showPagination = 0;
            } else {            
                $scope.showPagination = 1;
            };
            
            return Math.ceil(filteredData.length/$scope.pagination);
        }

        $scope.selectedFiles = function(files, e) {
            files.forEach(function(file) {
                if(file.name.charAt(0) != "_") {
                    if(!$scope.evidence.hasOwnProperty(file)) $scope.evidence[file.name] = file;
                } else {
                    $scope.file_name_error = true;
                }
            });
            $scope.icons = commons.loadIcons($scope.evidence); 
        }

        $scope.removeEvidence = function(name) {
            delete $scope.evidence[name];
            delete $scope.icons[name];
        }

        $scope.ok = function() {
            if($scope.vuln_type == "VulnerabilityWeb" && host_selected == true){
                $scope.incompatible_vulnWeb = true;
            } else {
                var res = {},
                id = $scope.target_selected._id + "." + CryptoJS.SHA1($scope.name + "." + $scope.desc).toString(),
                sha = CryptoJS.SHA1($scope.name + "." + $scope.desc).toString(),
                myDate = new Date(),
                myEpoch = myDate.getTime()/1000.0,
                extra_vulns_prop = {},
                arrayReferences = [];

                $scope.refs.forEach(function(r){
                    arrayReferences.push(r.ref);
                });
                
                arrayReferences.filter(Boolean);

                var res = {
                    "id":           id,
                    "data":         $scope.data,
                    "date":         myEpoch,
                    "desc":         $scope.desc,
                    "evidence":     $scope.evidence,
                    "meta":         {
                        'create_time': myEpoch,
                        "update_time": myEpoch,
                        "update_user":  'UI Web',
                        'update_action': 0,
                        'creator': 'UI Web', 
                        'create_time': myEpoch,
                        'update_controller_action': 'UI Web New',
                        'owner': 'anonymous'
                    },
                    "name":         $scope.name,
                    "oid":          sha,
                    "owned":        false,
                    "owner":        "",
                    "couch_parent": $scope.target_selected._id,
                    "refs":         arrayReferences,
                    "resolution":   $scope.resolution,
                    "status":       $scope.vuln_type,
                    "severity":     $scope.severitySelection,
                    "target":       name_selected,
                    "type":         $scope.vuln_type
                }

                if($scope.vuln_type == "VulnerabilityWeb") {
                    extra_vulns_prop = {
                        "path":         $scope.path,
                        "pname":        $scope.pname,
                        "query":        $scope.query,
                        "request":      $scope.request,
                        "resolution":   $scope.resolution,
                        "response":     $scope.response,
                        "web":          true, 
                        "website":      $scope.website
                    };
                } else {
                    extra_vulns_prop = {
                        "web":          false
                    };
                }

                for(var key in extra_vulns_prop) {
                    res[key] = extra_vulns_prop[key];
                }

                $modalInstance.close(res);
            }
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };

        $scope.$parent.isopen = ($scope.$parent.default === $scope.item);
 
        $scope.$watch('isopen', function (newvalue, oldvalue, $scope) {
            $scope.$parent.isopen = newvalue;
        });

        $scope.selected = function(i,j){
            if($scope.target_selected){
                $scope.target_selected.selected = false;
            }
            if(j != null){
                host_selected = false;
                $scope.target_selected = j;
                name_selected = i.name;
            }else{
                host_selected = true;
                $scope.target_selected = i;
                name_selected = i.name;
            }
            $scope.target_selected.selected = true;
            $scope.not_target_selected = true;
        }

        $scope.go = function(){
            if($scope.go_page < $scope.numberOfPages()+2 && $scope.go_page > -1){
                $scope.currentPage = $scope.go_page;
            }
        }

        $scope.newReference = function($event){
            $scope.refs.push({ref:''});
            $event.preventDefault();
        }
    }]);
