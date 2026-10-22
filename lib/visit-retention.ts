/**
 * How long visit rows (site_visits) are kept. The super admin chose 5 days on 2026-10-22: the Live visitor stream
 * shows this window, and app/api/cron/visit-retention deletes anything older every day, so every report built on
 * site_visits (User activities, Promotions attribution, a user's recent pages) has at most this much history.
 */
export const VISIT_RETENTION_DAYS = 5;
