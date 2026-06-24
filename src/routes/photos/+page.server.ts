import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { photosProjects, projects } from '$lib/server/db/schema';
import { eq, gte, lte, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Validate authentication
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  // Extract search parameters
  const search_text = url.searchParams.get('search_text') || '';
  const date_debut = url.searchParams.get('date_debut') || '';
  const date_fin = url.searchParams.get('date_fin') || '';

  try {
    const conditions = [];

    if (search_text) {
      conditions.push(sql`projects.id IN (SELECT rowid FROM projects_fts WHERE projects_fts MATCH ${search_text + '*'})`);
    }

    if (date_debut) {
      conditions.push(gte(projects.startDate, date_debut));
    }

    if (date_fin) {
      conditions.push(lte(projects.startDate, date_fin));
    }

    // Build the query with join
    const baseQuery = locals.db.select()
      .from(photosProjects)
      .innerJoin(projects, eq(photosProjects.projectId, projects.id));

    // Apply filters and limit
    const data = await (conditions.length > 0
      ? baseQuery.where(and(...conditions)).limit(100)
      : baseQuery.limit(100));

    return {
      photos: data.map(item => ({
        id: item.photos_projects.id,
        url: item.photos_projects.url,
        projectId: item.photos_projects.projectId,
        fileName: item.photos_projects.filename,
        projectName: item.projects.projectName,
        startDate: item.projects.startDate,
        description: item.projects.description
      })),
      search_text,
      date_debut,
      date_fin
    };
  } catch (err) {
    console.error('Error fetching photos:', err);
    throw error(500, 'Failed to fetch photos');
  }
};