import { query } from '../database/connection.js';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition?: string;
  synonyms: string[];
  ownerId?: string;
  relatedTerms: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTermInput {
  term: string;
  definition?: string;
  synonyms?: string[];
  ownerId?: string;
  relatedTerms?: string[];
}

export class GlossaryService {
  async create(input: CreateTermInput): Promise<GlossaryTerm> {
    const res = await query(
      `INSERT INTO glossary_terms (term, definition, synonyms, owner_id, related_terms, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [input.term, input.definition || null, JSON.stringify(input.synonyms || []), input.ownerId || null, JSON.stringify(input.relatedTerms || [])]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(): Promise<GlossaryTerm[]> {
    const res = await query(`SELECT * FROM glossary_terms ORDER BY term ASC`);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string): Promise<GlossaryTerm | null> {
    const res = await query(`SELECT * FROM glossary_terms WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async update(id: string, updates: Partial<CreateTermInput>): Promise<GlossaryTerm | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (updates.term) { params.push(updates.term); fields.push(`term = $${params.length}`); }
    if (updates.definition !== undefined) { params.push(updates.definition); fields.push(`definition = $${params.length}`); }
    if (updates.synonyms) { params.push(JSON.stringify(updates.synonyms)); fields.push(`synonyms = $${params.length}`); }
    if (updates.relatedTerms) { params.push(JSON.stringify(updates.relatedTerms)); fields.push(`related_terms = $${params.length}`); }
    if (fields.length === 0) return this.getById(id);
    params.push(id);
    const sql = `UPDATE glossary_terms SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`;
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async remove(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM glossary_terms WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  hydrate(row: any): GlossaryTerm {
    return {
      id: row.id,
      term: row.term,
      definition: row.definition,
      synonyms: row.synonyms || [],
      ownerId: row.owner_id,
      relatedTerms: row.related_terms || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const glossaryService = new GlossaryService();

