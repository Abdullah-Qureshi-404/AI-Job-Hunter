"""
Indexes for the Browse Jobs page.

The list view filters on is_active + job_type/source/country and orders by
date_posted, and relevance search runs ILIKE across title/company. Without
these Postgres sequentially scans the whole table for every keystroke and
every filter chip.

gin_trgm_ops powers fast ILIKE '%term%'; it needs the pg_trgm extension,
which is available on Supabase. If the extension cannot be created the
trigram indexes are skipped and the plain btree indexes still apply.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE INDEX IF NOT EXISTS jobs_job_active_posted_idx
                ON jobs_job (is_active, date_posted DESC NULLS LAST);

            CREATE INDEX IF NOT EXISTS jobs_job_active_type_idx
                ON jobs_job (is_active, job_type);

            CREATE INDEX IF NOT EXISTS jobs_job_active_source_idx
                ON jobs_job (is_active, source);

            CREATE INDEX IF NOT EXISTS jobs_job_active_remote_idx
                ON jobs_job (is_active, is_remote);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS jobs_job_active_posted_idx;
            DROP INDEX IF EXISTS jobs_job_active_type_idx;
            DROP INDEX IF EXISTS jobs_job_active_source_idx;
            DROP INDEX IF EXISTS jobs_job_active_remote_idx;
            """,
        ),
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                CREATE EXTENSION IF NOT EXISTS pg_trgm;

                CREATE INDEX IF NOT EXISTS jobs_job_title_trgm_idx
                    ON jobs_job USING gin (title gin_trgm_ops);

                CREATE INDEX IF NOT EXISTS jobs_job_company_trgm_idx
                    ON jobs_job USING gin (company gin_trgm_ops);
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipping trigram indexes: %', SQLERRM;
            END $$;
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS jobs_job_title_trgm_idx;
            DROP INDEX IF EXISTS jobs_job_company_trgm_idx;
            """,
        ),
    ]
