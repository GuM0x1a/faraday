# Faraday Penetration Test IDE
# Copyright (C) 2016  Infobyte LLC (http://www.infobytesec.com/)
# See the file 'doc/LICENSE' for the license information

from sqlalchemy.sql import func
from sqlalchemy.orm.query import Bundle

from server.dao.base import FaradayDAO
from server.models import Note, EntityMetadata
from server.utils.database import apply_search_filter

class NoteDAO(FaradayDAO):
    MAPPED_ENTITY = Note
    COLUMNS_MAP = {
        'couchid':      [EntityMetadata.couchdb_id],
        'name':         [Note.name],
        'text':         [Note.text],
        'description':  [Note.description],
    }
    STRICT_FILTERING = ["couchid"]

    def list(self, search=None, note_filter={}):
        results = self.__query_database(search, note_filter)

        rows = [ self.__get_note_data(result.note) for result in results ]

        result = {
            'rows': rows
        }

        return result

    def __query_database(self, search=None, note_filter={}):
        note_bundle = Bundle('note', Note.name, Note.text, Note.description, EntityMetadata.couchdb_id)

        query = self._session.query(note_bundle)\
                             .outerjoin(EntityMetadata, EntityMetadata.id == Note.entity_metadata_id)

        # Apply pagination, sorting and filtering options to the query
        query = apply_search_filter(query, self.COLUMNS_MAP, search, note_filter, self.STRICT_FILTERING)

        results = query.all()

        return results

    def __get_note_data(self, note):
        return {
            'id': note.couchdb_id,
            'key': note.couchdb_id,
            'value': {
                '_id': note.couchdb_id,
                'name': note.name,
                'text': note.text,
                'description': note.description,
                'couchid': note.couchdb_id }}

    def count(self):
        total_count = self._session.query(func.count(Note.id)).scalar()
        return { 'total_count': total_count }

