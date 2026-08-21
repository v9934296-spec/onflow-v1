/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: openapi/openapi.json (snapshot of the live FastAPI schema).
 * Regenerate: npm run api:generate
 */
export interface paths {
    "/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Root */
        get: operations["root__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Health
         * @description Liveness plus whether clip-review providers are configured (no secret values).
         *     When gemini_configured is false, free-tier jobs may complete with review_method
         *     provider_unavailable. Pro tier requires twelvelabs_configured unless rollback flag is set.
         */
        get: operations["health_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health/deep": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health Deep */
        get: operations["health_deep_health_deep_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/account/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Me */
        get: operations["get_me_api_v1_account_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/account/profile-image": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Profile Image */
        put: operations["update_profile_image_api_v1_account_profile_image_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete My Account */
        delete: operations["delete_my_account_api_v1_account_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/account/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Export My Data */
        get: operations["export_my_data_api_v1_account_export_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/account/quota": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Account Quota */
        get: operations["get_account_quota_api_v1_account_quota_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Consent Status */
        get: operations["get_consent_status_api_v1_consent_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consent/grant": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Grant Consent */
        post: operations["grant_consent_api_v1_consent_grant_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clip-retention": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Clip Retention
         * @description Current clip retention consent status (ISO timestamp string when opted in).
         */
        get: operations["get_clip_retention_api_v1_auth_clip_retention_get"];
        put?: never;
        /**
         * Post Clip Retention
         * @description Opt in or out of clip retention for model training.
         *
         *     When consent is True: clips from completed analyses will be retained on our servers
         *     to improve the coaching model.
         *
         *     When consent is False: clips are deleted after analysis as usual.
         *     Previously retained clips are NOT automatically deleted (contact support).
         */
        post: operations["post_clip_retention_api_v1_auth_clip_retention_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/clip-retention-consent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Set Clip Retention Consent Legacy
         * @description Legacy alias — same storage as POST /clip-retention (users table).
         */
        post: operations["set_clip_retention_consent_legacy_api_v1_auth_clip_retention_consent_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Session */
        post: operations["create_session_api_v1_auth_session_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/google": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sign In With Google */
        post: operations["sign_in_with_google_api_v1_auth_google_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/apple": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sign In With Apple */
        post: operations["sign_in_with_apple_api_v1_auth_apple_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/beta/client-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Post Client Event
         * @description First-party client funnel pings.
         *
         *     All allowlisted kinds are persisted to ``client_funnel_events`` for launch
         *     observability (no third-party analytics required). Share kinds remain
         *     available for admin share aggregates.
         */
        post: operations["post_client_event_api_v1_beta_client_events_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/share-stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Share Stats
         * @description Aggregated share funnel counts (persisted client_funnel_events).
         *     Requires Bearer auth for a user with users.is_admin (bootstrap via ONFLOW_ADMIN_EMAILS).
         */
        get: operations["share_stats_api_v1_admin_share_stats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clips/jobs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Clip Jobs */
        get: operations["list_clip_jobs_api_v1_clips_jobs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clips/jobs/{job_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Clip Job */
        get: operations["get_clip_job_api_v1_clips_jobs__job_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clips/initiate-upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Initiate Clip Upload */
        post: operations["initiate_clip_upload_api_v1_clips_initiate_upload_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/clips/{clip_id}/complete-upload": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Complete Clip Upload */
        post: operations["complete_clip_upload_api_v1_clips__clip_id__complete_upload_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Session */
        post: operations["create_session_api_v1_sessions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{session_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Session */
        get: operations["get_session_api_v1_sessions__session_id__get"];
        put?: never;
        post?: never;
        /** Delete Session */
        delete: operations["delete_session_api_v1_sessions__session_id__delete"];
        options?: never;
        head?: never;
        /** Update Session */
        patch: operations["update_session_api_v1_sessions__session_id__patch"];
        trace?: never;
    };
    "/api/v1/sessions/{session_id}/recap": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Session Recap
         * @description Aggregated progression recap for the session detail view (Step 5E).
         *
         *     Owner-scoped. Returns the same safe 404 used elsewhere for a missing,
         *     soft-deleted, or non-owned session (no ownership leak).
         */
        get: operations["get_session_recap_api_v1_sessions__session_id__recap_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List My Sessions */
        get: operations["list_my_sessions_api_v1_me_sessions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{session_id}/participants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Participant */
        post: operations["add_participant_api_v1_sessions__session_id__participants_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{session_id}/participants/{participant_user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove Participant */
        delete: operations["remove_participant_api_v1_sessions__session_id__participants__participant_user_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/session-attempts/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Sync Session Attempts
         * @description Immutable batch sync of client-logged attempts.
         *
         *     Client ids are primary keys. Replaying an identical payload is accepted and
         *     changes nothing; replaying a *different* payload under an existing id is
         *     rejected. Nothing in this endpoint mutates an existing attempt.
         */
        post: operations["sync_session_attempts_api_v1_session_attempts_sync_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{session_id}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Session Attempts */
        get: operations["list_session_attempts_api_v1_sessions__session_id__attempts_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/tricks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Tricks */
        get: operations["list_tricks_api_v1_tricks_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/feed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Feed
         * @description V1: returns the signed-in user's own propagated feed events.
         */
        get: operations["list_feed_api_v1_feed_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/feed/sse-ticket": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Issue Feed Sse Ticket
         * @description Mint a short-lived SSE ticket for EventSource ``?token=`` (not the session JWT).
         */
        post: operations["issue_feed_sse_ticket_api_v1_feed_sse_ticket_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/feed/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Feed Stream
         * @description SSE stream of feed updates for the signed-in user (contracts §8.2).
         */
        get: operations["feed_stream_api_v1_feed_stream_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progression/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Progression Timeline
         * @description Owner-scoped, newest-first history of the user's completed sessions.
         *
         *     Offset pagination (``page``/``page_size``); lightweight session previews only.
         */
        get: operations["get_progression_timeline_api_v1_progression_timeline_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progression/tricks/{trick_name}/compare": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Trick Clip Compare
         * @description Owner-scoped oldest-vs-newest clip comparison for one trick (Step 5G).
         */
        get: operations["get_trick_clip_compare_api_v1_progression_tricks__trick_name__compare_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/progression/overview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Progression Overview
         * @description P.T.E. Tech 1.0 — full progression snapshot for dashboard.
         */
        get: operations["get_progression_overview_api_v1_stats_progression_overview_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/milestones": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Milestones
         * @description P.T.E. Tech 1.0 — all milestones unlocked by this user.
         */
        get: operations["get_milestones_api_v1_stats_milestones_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/progression/whats-next": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Whats Next
         * @description P.T.E. Tech 1.0 — single focus recommendation from recent Gemini coaching.
         */
        get: operations["get_whats_next_api_v1_stats_progression_whats_next_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/tricks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Trick Stats */
        get: operations["get_trick_stats_api_v1_stats_tricks_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/tricks/{trick_name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Trick Detail */
        get: operations["get_trick_detail_api_v1_stats_tricks__trick_name__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/tricks/{trick_name}/progression": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Trick Progression
         * @description P.T.E. Tech 1.0 — merged trick detail + compare + coaching timeline.
         */
        get: operations["get_trick_progression_api_v1_stats_tricks__trick_name__progression_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/sessions/latest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Latest Session */
        get: operations["get_latest_session_api_v1_stats_sessions_latest_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/stats/sessions/{session_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Session Detail */
        get: operations["get_session_detail_api_v1_stats_sessions__session_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List Lines
         * @description List all custom lines with attempt stats.
         */
        get: operations["list_lines_api_v1_lines_get"];
        put?: never;
        /**
         * Create Line
         * @description Create a custom line definition.
         */
        post: operations["create_line_api_v1_lines_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lines/{line_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Line
         * @description Get a single line with full attempt history.
         */
        get: operations["get_line_api_v1_lines__line_id__get"];
        /**
         * Update Line
         * @description Update a line's name or trick sequence.
         */
        put: operations["update_line_api_v1_lines__line_id__put"];
        post?: never;
        /**
         * Delete Line
         * @description Delete a line and all its attempts.
         */
        delete: operations["delete_line_api_v1_lines__line_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/lines/{line_id}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record Line Attempt
         * @description Record an attempt of a custom line.
         */
        post: operations["record_line_attempt_api_v1_lines__line_id__attempts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/billing/sync": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Sync Billing
         * @description Link the caller's RevenueCat customer id and return current entitlement state.
         *
         *     This does NOT change entitlements. Tier changes (purchase, renewal, expiration,
         *     cancellation) and Re-Up bonus credits are applied exclusively by the authenticated
         *     RevenueCat webhook, which is the single source of truth. After a purchase the client
         *     should call this to link its RC id, then refetch entitlement state once the webhook
         *     lands (typically within seconds).
         */
        post: operations["sync_billing_api_v1_billing_sync_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/webhooks/revenuecat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Revenuecat Webhook
         * @description Apply authenticated RevenueCat subscription and Re-Up events.
         */
        post: operations["revenuecat_webhook_api_v1_webhooks_revenuecat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** AccountQuotaResponse */
        AccountQuotaResponse: {
            /** Tier */
            tier: string;
            /** Analyses Remaining */
            analyses_remaining: number;
            /** Trial Expires At */
            trial_expires_at?: string | null;
            /** Subscription Status */
            subscription_status: string;
            /** Bonus Analyses */
            bonus_analyses: number;
            /**
             * Monthly Free Remaining
             * @description None when Pro/Coach (unlimited analyses).
             */
            monthly_free_remaining?: number | null;
        };
        /** ActionableCuePayload */
        ActionableCuePayload: {
            /** Cue */
            cue: string;
            /** Why It Matters */
            why_it_matters: string;
            /** Drill */
            drill?: string | null;
        };
        /** AttemptCompareLatestPayload */
        AttemptCompareLatestPayload: {
            /** Job Id */
            job_id: string;
            /** Landed */
            landed?: string | null;
            /** Review Readiness */
            review_readiness?: string | null;
            /** Primary Issue Key */
            primary_issue_key?: string | null;
            /** Primary Issue Label */
            primary_issue_label?: string | null;
            /** Best Cue */
            best_cue?: string | null;
            /** Best Drill */
            best_drill?: string | null;
            /** Technical Limit Summary */
            technical_limit_summary?: string | null;
            /** Created At */
            created_at?: string | null;
        };
        /** AttemptComparePayload */
        AttemptComparePayload: {
            /** Compare Available */
            compare_available: boolean;
            /** Trick Name */
            trick_name: string;
            /** Baseline Window Count */
            baseline_window_count: number;
            latest_attempt?: components["schemas"]["AttemptCompareLatestPayload"] | null;
            /** Previous Attempts */
            previous_attempts?: components["schemas"]["AttemptComparePreviousPayload"][];
            /** Improvements */
            improvements?: string[];
            /** Repeated Issues */
            repeated_issues?: string[];
            /** Regressions */
            regressions?: string[];
            /** Compare Summary */
            compare_summary: string;
            /** Best Next Focus */
            best_next_focus?: string | null;
        };
        /** AttemptComparePreviousPayload */
        AttemptComparePreviousPayload: {
            /** Job Id */
            job_id: string;
            /** Landed */
            landed?: string | null;
            /** Review Readiness */
            review_readiness?: string | null;
            /** Primary Issue Key */
            primary_issue_key?: string | null;
            /** Primary Issue Label */
            primary_issue_label?: string | null;
            /** Best Cue */
            best_cue?: string | null;
            /** Best Drill */
            best_drill?: string | null;
            /** Created At */
            created_at?: string | null;
        };
        /** ClientBetaEventRequest */
        ClientBetaEventRequest: {
            /** Kind */
            kind: string;
            /** Job Id */
            job_id?: string | null;
            /** Share Target */
            share_target?: string | null;
            /** Error Detail */
            error_detail?: string | null;
            /** Ref Source */
            ref_source?: string | null;
        };
        /** ClientBetaEventResponse */
        ClientBetaEventResponse: {
            /**
             * Ok
             * @default true
             */
            ok: boolean;
        };
        /** ClipCompleteUploadResponse */
        ClipCompleteUploadResponse: {
            /** Id */
            id: string;
            /** User Id */
            user_id: string;
            /** Session Id */
            session_id?: string | null;
            /** Upload Status */
            upload_status: string;
            /** Storage Key */
            storage_key: string;
            /** Duration Seconds */
            duration_seconds?: number | null;
            /** Width Px */
            width_px?: number | null;
            /** Height Px */
            height_px?: number | null;
            /** Content Type */
            content_type?: string | null;
            /** Trick Id */
            trick_id?: string | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
            /** Landed */
            landed?: boolean | null;
            /** Pte Rating */
            pte_rating?: number | null;
            /** Created At */
            created_at: string;
            /** Updated At */
            updated_at: string;
            /** Estimated Analysis Completion At */
            estimated_analysis_completion_at?: string | null;
        };
        /** ClipInitiateUploadRequest */
        ClipInitiateUploadRequest: {
            /** Session Id */
            session_id?: string | null;
            /** Duration Seconds */
            duration_seconds: number;
            /** Width Px */
            width_px: number;
            /** Height Px */
            height_px: number;
            /**
             * Content Type
             * @enum {string}
             */
            content_type: "video/mp4" | "video/quicktime";
            /** Size Bytes */
            size_bytes: number;
            /** Client Hint Trick Id */
            client_hint_trick_id?: string | null;
            /**
             * Captured At
             * @description When the skater filmed the clip. Required for the launch client so an ended session can accept a delayed upload only when capture predates ended_at. Omitted by onflow-lite; the 24h window still applies.
             */
            captured_at?: string | null;
        };
        /** ClipInitiateUploadResponse */
        ClipInitiateUploadResponse: {
            /** Clip Id */
            clip_id: string;
            /** Upload Url */
            upload_url: string;
            /**
             * Upload Method
             * @default PUT
             * @constant
             */
            upload_method: "PUT";
            /** Upload Expires At */
            upload_expires_at: string;
            /** Storage Key */
            storage_key: string;
        };
        /** ClipResultPayload */
        ClipResultPayload: {
            /**
             * Schema Version
             * @default 1
             */
            schema_version: number;
            /**
             * Analysis Type
             * @default skate_clip_review
             * @constant
             */
            analysis_type: "skate_clip_review";
            /** Clip Label */
            clip_label: string;
            /** Review Summary */
            review_summary: string;
            /**
             * Review Readiness
             * @enum {string}
             */
            review_readiness: "usable" | "limited" | "insufficient";
            /** Video Playback Url */
            video_playback_url?: string | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
            quality_signals: components["schemas"]["QualitySignalsPayload"];
            /** Observations */
            observations?: string[];
            /** Uncertainty Notes */
            uncertainty_notes?: string[];
            /** Processing Notes */
            processing_notes?: string[];
            skate_clip_review?: components["schemas"]["SkateClipReviewBlockPayload"] | null;
            coaching?: components["schemas"]["CoachingObservations"] | null;
            /** Landed */
            landed?: ("yes" | "no" | "unclear") | null;
            /** Land Score */
            land_score?: number | null;
            /** Primary Issue Key */
            primary_issue_key?: string | null;
            /** Primary Issue Label */
            primary_issue_label?: string | null;
            /** Best Cue */
            best_cue?: string | null;
            /** Best Drill */
            best_drill?: string | null;
            /** Review Method */
            review_method?: string | null;
            /** Gemini Used */
            gemini_used?: boolean | null;
            /** Technical Limit Summary */
            technical_limit_summary?: string | null;
            /** First Actionable Cue Shown */
            first_actionable_cue_shown?: string | null;
            /** First Drill Shown */
            first_drill_shown?: string | null;
            normalized_review?: components["schemas"]["NormalizedReviewPayload"] | null;
            expected_mechanics?: components["schemas"]["ExpectedMechanicsPayload"] | null;
            attempt_compare?: components["schemas"]["AttemptComparePayload"] | null;
            session_recap?: components["schemas"]["SessionRecapPayload"] | null;
        };
        /** ClipRetentionConsentRequest */
        ClipRetentionConsentRequest: {
            /**
             * Consent
             * @description Opt in (true) or withdraw (false) clip retention for training.
             */
            consent: boolean;
        };
        /** ClipRetentionConsentResponse */
        ClipRetentionConsentResponse: {
            /** Clip Retention Consent */
            clip_retention_consent: boolean;
            /** Clip Retention Consent At */
            clip_retention_consent_at: string | null;
        };
        /** ClipRetentionRequest */
        ClipRetentionRequest: {
            /** Consent */
            consent: boolean;
        };
        /** ClipRetentionResponse */
        ClipRetentionResponse: {
            /** Clip Retention Consent */
            clip_retention_consent: boolean;
            /** Clip Retention Consent At */
            clip_retention_consent_at?: string | null;
        };
        /** CoachingObservations */
        CoachingObservations: {
            /** Body Position */
            body_position?: string | null;
            /** Foot Placement */
            foot_placement?: string | null;
            /** Timing */
            timing?: string | null;
            /** Board Control */
            board_control?: string | null;
            /** Commitment */
            commitment?: string | null;
            /** Balance */
            balance?: string | null;
            /** Style Notes */
            style_notes?: string | null;
            /** Improvement Drill */
            improvement_drill?: string | null;
        };
        /** ConsentGrantRequest */
        ConsentGrantRequest: {
            /** Copy Version */
            copy_version: string;
        };
        /** ConsentGrantResponse */
        ConsentGrantResponse: {
            status: components["schemas"]["ConsentStatus"];
        };
        /** ConsentStatus */
        ConsentStatus: {
            /** Granted */
            granted: boolean;
            /** Granted At */
            granted_at: string | null;
            /** Copy Version */
            copy_version: string | null;
            /** Source */
            source: string | null;
        };
        /** CreateLineRequest */
        CreateLineRequest: {
            /** Line Name */
            line_name: string;
            /** Trick Sequence */
            trick_sequence: string[];
        };
        /** ExpectedMechanicsCheckpointPayload */
        ExpectedMechanicsCheckpointPayload: {
            /** Expected */
            expected: string;
            /** Observed */
            observed: string;
            /** Impact */
            impact: string;
        };
        /** ExpectedMechanicsPayload */
        ExpectedMechanicsPayload: {
            /** Trick Name */
            trick_name: string;
            /** Overview */
            overview: string;
            /** Checkpoints */
            checkpoints: components["schemas"]["ExpectedMechanicsCheckpointPayload"][];
            /** Best Next Try */
            best_next_try: string;
            /** Drill */
            drill?: string | null;
        };
        /** FeedEventItemResponse */
        FeedEventItemResponse: {
            /** Id */
            id: string;
            user: components["schemas"]["FeedUserResponse"];
            /** Event Type */
            event_type: string;
            /** Event Version */
            event_version: string;
            /** Payload */
            payload: {
                [key: string]: unknown;
            };
            /** Generated At */
            generated_at: string;
            reactions_summary: components["schemas"]["ReactionsSummaryResponse"];
        };
        /** FeedListResponse */
        FeedListResponse: {
            /** Items */
            items: components["schemas"]["FeedEventItemResponse"][];
            /** Next Cursor */
            next_cursor?: string | null;
            /** Lifecycle Stage */
            lifecycle_stage: string;
        };
        /** FeedUserResponse */
        FeedUserResponse: {
            /** User Id */
            user_id: string;
            /** Username */
            username: string;
            /** Tag Name */
            tag_name: string;
            /** Profile Photo Url */
            profile_photo_url?: string | null;
            /**
             * Tier
             * @default flow
             */
            tier: string;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** JobCompletedResponse */
        JobCompletedResponse: {
            /** Job Id */
            job_id: string;
            /**
             * Status
             * @constant
             */
            status: "completed";
            /** Updated At */
            updated_at: string;
            result: components["schemas"]["ClipResultPayload"];
        };
        /** JobFailedResponse */
        JobFailedResponse: {
            /** Job Id */
            job_id: string;
            /**
             * Status
             * @constant
             */
            status: "failed";
            /** Updated At */
            updated_at: string;
            /** Failure Reason */
            failure_reason: string;
        };
        /** JobListItem */
        JobListItem: {
            /** Job Id */
            job_id: string;
            /**
             * Status
             * @enum {string}
             */
            status: "pending" | "processing" | "completed" | "failed";
            /** Clip Label */
            clip_label: string;
            /** Updated At */
            updated_at: string;
            /** Failure Reason */
            failure_reason?: string | null;
            /** Video Playback Url */
            video_playback_url?: string | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
        };
        /** JobPendingResponse */
        JobPendingResponse: {
            /** Job Id */
            job_id: string;
            /**
             * Status
             * @constant
             */
            status: "pending";
            /** Updated At */
            updated_at: string;
        };
        /** JobProcessingResponse */
        JobProcessingResponse: {
            /** Job Id */
            job_id: string;
            /**
             * Status
             * @constant
             */
            status: "processing";
            /** Updated At */
            updated_at: string;
        };
        /** MeResponse */
        MeResponse: {
            /** User Id */
            user_id: string;
            /** Email */
            email: string;
            /** Tier */
            tier: string;
            /** Profile Image Url */
            profile_image_url?: string | null;
            consent: components["schemas"]["ConsentStatus"];
        };
        /** MechanicsDimensionPayload */
        MechanicsDimensionPayload: {
            /** Name */
            name: string;
            /** Score */
            score?: number | null;
            /** Assessment */
            assessment: string;
            /** Evidence */
            evidence?: string | null;
        };
        /**
         * NormalizedReviewPayload
         * @description Stable mobile-friendly slice derived from Gemini output.
         */
        NormalizedReviewPayload: {
            /** Summary */
            summary: string;
            /** Score */
            score?: number | null;
            /** Label */
            label?: string | null;
            /** What You Did Right */
            what_you_did_right?: string[];
            /** What To Fix */
            what_to_fix?: string[];
            /** Drill */
            drill?: string | null;
            /**
             * Model
             * @default gemini
             * @constant
             */
            model: "gemini";
        };
        /** OAuthSignInResponse */
        OAuthSignInResponse: {
            /** Token */
            token: string;
            /** User Id */
            user_id: string;
            /** Is New User */
            is_new_user: boolean;
            /** Bonus Analyses Remaining */
            bonus_analyses_remaining: number;
        };
        /** ProfileImageUpdateRequest */
        ProfileImageUpdateRequest: {
            /** Profile Image Url */
            profile_image_url?: string | null;
        };
        /**
         * ProgressionTimelineItem
         * @description One session preview in the progression timeline. Lightweight by design.
         */
        ProgressionTimelineItem: {
            /** Session Id */
            session_id: string;
            /** Ended At */
            ended_at?: string | null;
            /** Spot */
            spot?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /** Duration Seconds */
            duration_seconds?: number | null;
            /**
             * Clips Count
             * @default 0
             */
            clips_count: number;
            /**
             * Attempt Count
             * @default 0
             */
            attempt_count: number;
            /** Best Pte Score */
            best_pte_score?: number | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
        };
        /**
         * ProgressionTimelineResponse
         * @description Owner-scoped, offset-paginated progression history (newest-first).
         */
        ProgressionTimelineResponse: {
            /** Items */
            items?: components["schemas"]["ProgressionTimelineItem"][];
            /** Page */
            page: number;
            /** Page Size */
            page_size: number;
            /** Has More */
            has_more: boolean;
        };
        /** ProviderTokenRequest */
        ProviderTokenRequest: {
            /** Id Token */
            id_token: string;
        };
        /** QualitySignalsPayload */
        QualitySignalsPayload: {
            /** Duration Seconds */
            duration_seconds?: number | null;
            /**
             * Frames Sampled
             * @default 0
             */
            frames_sampled: number;
            /**
             * Motion Detected
             * @default false
             */
            motion_detected: boolean;
            /**
             * Video Readable
             * @default false
             */
            video_readable: boolean;
            /** Fps */
            fps?: number | null;
            /** Frame Count Estimated */
            frame_count_estimated?: number | null;
            /** Mean Brightness 0 1 */
            mean_brightness_0_1?: number | null;
            /** Laplacian Var Mean */
            laplacian_var_mean?: number | null;
            /** Mechanics Dimensions */
            mechanics_dimensions?: components["schemas"]["MechanicsDimensionPayload"][];
        };
        /** ReactionBucketResponse */
        ReactionBucketResponse: {
            /**
             * Count
             * @default 0
             */
            count: number;
            /**
             * Viewer Reacted
             * @default false
             */
            viewer_reacted: boolean;
            /** Reactor User Ids */
            reactor_user_ids?: string[];
        };
        /** ReactionsSummaryResponse */
        ReactionsSummaryResponse: {
            fire?: components["schemas"]["ReactionBucketResponse"];
            saw_it?: components["schemas"]["ReactionBucketResponse"];
            same_battle?: components["schemas"]["ReactionBucketResponse"];
            progression?: components["schemas"]["ReactionBucketResponse"];
        };
        /** SessionAttemptIn */
        SessionAttemptIn: {
            /** Id */
            id: string;
            /** Session Id */
            session_id: string;
            /** Trick Id */
            trick_id: string;
            /** Canonical Name */
            canonical_name: string;
            /**
             * Outcome
             * @enum {string}
             */
            outcome: "landed" | "missed";
            /**
             * Logged At
             * @description ISO-8601 timestamp from the client clock.
             */
            logged_at: string;
        };
        /** SessionAttemptListResponse */
        SessionAttemptListResponse: {
            /** Attempts */
            attempts: components["schemas"]["SessionAttemptOut"][];
        };
        /** SessionAttemptOut */
        SessionAttemptOut: {
            /** Id */
            id: string;
            /** Session Id */
            session_id: string;
            /** Trick Id */
            trick_id: string;
            /** Canonical Name */
            canonical_name: string;
            /**
             * Outcome
             * @enum {string}
             */
            outcome: "landed" | "missed";
            /** Logged At */
            logged_at: string;
        };
        /** SessionAttemptRejected */
        SessionAttemptRejected: {
            /** Id */
            id: string;
            /**
             * Reason
             * @description Machine-readable cause. Clients branch on this value and never on prose.
             * @enum {string}
             */
            reason: "missing_id" | "invalid_logged_at" | "session_not_found" | "forbidden" | "attempt_deleted" | "session_immutable" | "outcome_immutable" | "attempt_immutable" | "duplicate_in_batch";
        };
        /** SessionAttemptSyncRequest */
        SessionAttemptSyncRequest: {
            /** Attempts */
            attempts?: components["schemas"]["SessionAttemptIn"][];
        };
        /** SessionAttemptSyncResponse */
        SessionAttemptSyncResponse: {
            /** Accepted */
            accepted: string[];
            /** Rejected */
            rejected: components["schemas"]["SessionAttemptRejected"][];
        };
        /** SessionClipSummary */
        SessionClipSummary: {
            /** Id */
            id: string;
            /** Trick Id */
            trick_id?: string | null;
            /** Trick Display */
            trick_display?: string | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
            /** Landed */
            landed?: boolean | null;
            /** Pte Rating */
            pte_rating?: number | null;
            /** Created At */
            created_at: string;
            /**
             * Is First Land
             * @default false
             */
            is_first_land: boolean;
        };
        /** SessionCreate */
        SessionCreate: {
            /** Spot Label */
            spot_label?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /** Notes */
            notes?: string | null;
            /** Started At */
            started_at?: string | null;
        };
        /** SessionCreateRequest */
        SessionCreateRequest: {
            /** Email */
            email: string;
        };
        /** SessionCreateResponse */
        SessionCreateResponse: {
            /** User Id */
            user_id: string;
            /** Session Token */
            session_token: string;
            /** Email */
            email: string;
        };
        /** SessionListItem */
        SessionListItem: {
            /** Id */
            id: string;
            /** Spot Label */
            spot_label?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /** Started At */
            started_at: string;
            /** Ended At */
            ended_at?: string | null;
            /**
             * Clip Count
             * @default 0
             */
            clip_count: number;
            /**
             * Attempt Count
             * @default 0
             */
            attempt_count: number;
            /** Breakthrough Note */
            breakthrough_note?: string | null;
            /** Tricks Attempted */
            tricks_attempted?: string[];
            /** Preview Thumbnail Url */
            preview_thumbnail_url?: string | null;
        };
        /** SessionListResponse */
        SessionListResponse: {
            /** Items */
            items: components["schemas"]["SessionListItem"][];
            /** Next Cursor */
            next_cursor?: string | null;
        };
        /** SessionParticipantAdd */
        SessionParticipantAdd: {
            /** User Id */
            user_id: string;
        };
        /** SessionParticipantResponse */
        SessionParticipantResponse: {
            /** User Id */
            user_id: string;
            /** Username */
            username?: string | null;
            /** Tag Name */
            tag_name?: string | null;
            /** Profile Photo Url */
            profile_photo_url?: string | null;
        };
        /**
         * SessionRecapClip
         * @description One clip inside a session recap detail (Step 5E).
         */
        SessionRecapClip: {
            /** Clip Id */
            clip_id: string;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
            /** Video Playback Url */
            video_playback_url?: string | null;
            /** Trick */
            trick?: string | null;
            /** Stance */
            stance?: string | null;
            /** Landed */
            landed?: boolean | null;
            /** Pte Score */
            pte_score?: number | null;
            /** Created At */
            created_at: string;
        };
        /**
         * SessionRecapDetailResponse
         * @description Aggregated session recap for the progression detail view (Step 5E).
         *
         *     Metrics use existing data only. When a metric cannot be derived honestly it is
         *     ``null`` rather than a guessed value. Clips are ordered newest-first.
         */
        SessionRecapDetailResponse: {
            /** Session Id */
            session_id: string;
            /** Started At */
            started_at: string;
            /** Ended At */
            ended_at?: string | null;
            /** Duration Seconds */
            duration_seconds?: number | null;
            /** Spot */
            spot?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /**
             * Clips Count
             * @default 0
             */
            clips_count: number;
            /**
             * Attempts Count
             * @default 0
             */
            attempts_count: number;
            /** Landed Count */
            landed_count?: number | null;
            /** Landed Rate */
            landed_rate?: number | null;
            /** Best Pte Score */
            best_pte_score?: number | null;
            /** Average Pte Score */
            average_pte_score?: number | null;
            /** Breakthrough Note */
            breakthrough_note?: string | null;
            /** Clips */
            clips?: components["schemas"]["SessionRecapClip"][];
        };
        /** SessionRecapPayload */
        SessionRecapPayload: {
            /** Recap Available */
            recap_available: boolean;
            /** Session Id */
            session_id: string;
            /** Started At */
            started_at?: string | null;
            /** Ended At */
            ended_at?: string | null;
            /** Session Attempt Count */
            session_attempt_count: number;
            /** Trick Count */
            trick_count: number;
            /** Trick Breakdown */
            trick_breakdown?: components["schemas"]["SessionRecapTrickBreakdownPayload"][];
            /** Strongest Progress Area */
            strongest_progress_area?: string | null;
            /** Repeated Session Issue */
            repeated_session_issue?: string | null;
            /** Late Session Dropoff */
            late_session_dropoff?: string | null;
            /** Best Trick Of Session */
            best_trick_of_session?: string | null;
            /** Session Summary */
            session_summary: string;
            /** Next Session Focus */
            next_session_focus: string;
            /** Recommended Drill */
            recommended_drill?: string | null;
        };
        /** SessionRecapTrickBreakdownPayload */
        SessionRecapTrickBreakdownPayload: {
            /** Trick Name */
            trick_name: string;
            /** Attempts */
            attempts: number;
            /** Landed Count */
            landed_count?: number | null;
            /** Unclear Count */
            unclear_count?: number | null;
            /** Primary Repeated Issue */
            primary_repeated_issue?: string | null;
            /** Best Cue */
            best_cue?: string | null;
        };
        /** SessionResponse */
        SessionResponse: {
            /** Id */
            id: string;
            /** User Id */
            user_id: string;
            /** Spot Label */
            spot_label?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /** Notes */
            notes?: string | null;
            /** Started At */
            started_at: string;
            /** Ended At */
            ended_at?: string | null;
            /** Breakthrough Note */
            breakthrough_note?: string | null;
            /**
             * Clip Count
             * @default 0
             */
            clip_count: number;
            /**
             * Attempt Count
             * @default 0
             */
            attempt_count: number;
            /** Participants */
            participants?: components["schemas"]["SessionParticipantResponse"][];
            /** Created At */
            created_at: string;
            /** Updated At */
            updated_at?: string | null;
            /** Clips */
            clips?: components["schemas"]["SessionClipSummary"][] | null;
        };
        /** SessionUpdate */
        SessionUpdate: {
            /** Ended At */
            ended_at?: string | null;
            /** Breakthrough Note */
            breakthrough_note?: string | null;
            /** Spot Label */
            spot_label?: string | null;
            /** Focus Trick */
            focus_trick?: string | null;
            /** Notes */
            notes?: string | null;
        };
        /** SkateClipReviewBlockPayload */
        SkateClipReviewBlockPayload: {
            /** Strengths */
            strengths?: string[];
            /** Improvement Areas */
            improvement_areas?: string[];
            /** Actionable Cues */
            actionable_cues?: components["schemas"]["ActionableCuePayload"][];
        };
        /**
         * SyncRequest
         * @description Client's view of entitlements after purchase or restore.
         *
         *     ``has_pro``, ``sync_tier`` and ``bonus_purchased`` are accepted for backward
         *     compatibility but are **informational only** — the server never grants tier or
         *     bonus from these client claims. The RevenueCat webhook is the source of truth.
         */
        SyncRequest: {
            /**
             * Has Pro
             * @description RevenueCat SDK's view of the 'pro' entitlement. Informational only — ignored.
             */
            has_pro: boolean;
            /**
             * Sync Tier
             * @description Client-reported tier. Informational only — ignored; the webhook sets tier.
             */
            sync_tier?: string | null;
            /**
             * Bonus Purchased
             * @description Client-reported Re-Up bonus count. Informational only — ignored; the webhook credits Re-Up packs.
             * @default 0
             */
            bonus_purchased: number;
            /**
             * Rc App User Id
             * @description RevenueCat app_user_id so the backend can link for future webhooks.
             */
            rc_app_user_id?: string | null;
        };
        /** SyncResponse */
        SyncResponse: {
            /** Tier */
            tier: string;
            /** Bonus Analyses */
            bonus_analyses: number;
            /** Monthly Free Remaining */
            monthly_free_remaining: number | null;
        };
        /** TrickClipCompareResponse */
        TrickClipCompareResponse: {
            /** Trick Name */
            trick_name: string;
            /** Trick Display */
            trick_display: string;
            /** Compare Available */
            compare_available: boolean;
            /** Days Between */
            days_between?: number | null;
            /** Pte Delta */
            pte_delta?: number | null;
            /** Oldest Landed */
            oldest_landed?: boolean | null;
            /** Newest Landed */
            newest_landed?: boolean | null;
            oldest_clip?: components["schemas"]["TrickCompareClip"] | null;
            newest_clip?: components["schemas"]["TrickCompareClip"] | null;
            /** Progress Notes */
            progress_notes?: string[];
            /**
             * Clips Count
             * @default 0
             */
            clips_count: number;
        };
        /** TrickCompareClip */
        TrickCompareClip: {
            /** Clip Id */
            clip_id: string;
            /** Session Id */
            session_id?: string | null;
            /** Thumbnail Url */
            thumbnail_url?: string | null;
            /** Video Playback Url */
            video_playback_url?: string | null;
            /** Pte Score */
            pte_score?: number | null;
            /** Landed */
            landed?: boolean | null;
            /** Created At */
            created_at: string;
        };
        /** TrickListResponse */
        TrickListResponse: {
            /** Tricks */
            tricks: components["schemas"]["TrickOut"][];
        };
        /** TrickOut */
        TrickOut: {
            /**
             * Id
             * @description Stable trick_id: lowercase canonical name.
             */
            id: string;
            /** Name */
            name: string;
            /** Category */
            category: string;
            /** Aliases */
            aliases?: string[];
            /** Difficulty Tier */
            difficulty_tier: number;
            /** Rotation */
            rotation?: string | null;
        };
        /** UpdateLineRequest */
        UpdateLineRequest: {
            /** Line Name */
            line_name?: string | null;
            /** Trick Sequence */
            trick_sequence?: string[] | null;
        };
        /** ValidationError */
        ValidationError: {
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
            /** Input */
            input?: unknown;
            /** Context */
            ctx?: Record<string, never>;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    root__get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    health_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string | boolean;
                    };
                };
            };
        };
    };
    health_deep_health_deep_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_me_api_v1_account_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
        };
    };
    update_profile_image_api_v1_account_profile_image_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProfileImageUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MeResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_my_account_api_v1_account_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    export_my_data_api_v1_account_export_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_account_quota_api_v1_account_quota_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountQuotaResponse"];
                };
            };
        };
    };
    get_consent_status_api_v1_consent_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentStatus"];
                };
            };
        };
    };
    grant_consent_api_v1_consent_grant_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConsentGrantRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentGrantResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_clip_retention_api_v1_auth_clip_retention_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipRetentionResponse"];
                };
            };
        };
    };
    post_clip_retention_api_v1_auth_clip_retention_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClipRetentionRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipRetentionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_clip_retention_consent_legacy_api_v1_auth_clip_retention_consent_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClipRetentionConsentRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipRetentionConsentResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_session_api_v1_auth_session_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionCreateRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionCreateResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    sign_in_with_google_api_v1_auth_google_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProviderTokenRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OAuthSignInResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    sign_in_with_apple_api_v1_auth_apple_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ProviderTokenRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OAuthSignInResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    post_client_event_api_v1_beta_client_events_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClientBetaEventRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClientBetaEventResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    share_stats_api_v1_admin_share_stats_get: {
        parameters: {
            query?: {
                days?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_clip_jobs_api_v1_clips_jobs_get: {
        parameters: {
            query?: {
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobListItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_clip_job_api_v1_clips_jobs__job_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                job_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["JobPendingResponse"] | components["schemas"]["JobProcessingResponse"] | components["schemas"]["JobCompletedResponse"] | components["schemas"]["JobFailedResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    initiate_clip_upload_api_v1_clips_initiate_upload_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ClipInitiateUploadRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipInitiateUploadResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    complete_clip_upload_api_v1_clips__clip_id__complete_upload_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                clip_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ClipCompleteUploadResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_session_api_v1_sessions_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_session_api_v1_sessions__session_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_session_api_v1_sessions__session_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_session_api_v1_sessions__session_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_session_recap_api_v1_sessions__session_id__recap_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionRecapDetailResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_my_sessions_api_v1_me_sessions_get: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionListResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_participant_api_v1_sessions__session_id__participants_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionParticipantAdd"];
            };
        };
        responses: {
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Successful Response */
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    remove_participant_api_v1_sessions__session_id__participants__participant_user_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
                participant_user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
            /** @description Successful Response */
            501: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    sync_session_attempts_api_v1_session_attempts_sync_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SessionAttemptSyncRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionAttemptSyncResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_session_attempts_api_v1_sessions__session_id__attempts_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionAttemptListResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_tricks_api_v1_tricks_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TrickListResponse"];
                };
            };
        };
    };
    list_feed_api_v1_feed_get: {
        parameters: {
            query?: {
                limit?: number;
                cursor?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FeedListResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    issue_feed_sse_ticket_api_v1_feed_sse_ticket_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    feed_stream_api_v1_feed_stream_get: {
        parameters: {
            query?: {
                lastEventId?: string | null;
                token?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_progression_timeline_api_v1_progression_timeline_get: {
        parameters: {
            query?: {
                page?: number;
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressionTimelineResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_trick_clip_compare_api_v1_progression_tricks__trick_name__compare_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trick_name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TrickClipCompareResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_progression_overview_api_v1_stats_progression_overview_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_milestones_api_v1_stats_milestones_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    }[];
                };
            };
        };
    };
    get_whats_next_api_v1_stats_progression_whats_next_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_trick_stats_api_v1_stats_tricks_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    }[];
                };
            };
        };
    };
    get_trick_detail_api_v1_stats_tricks__trick_name__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trick_name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_trick_progression_api_v1_stats_tricks__trick_name__progression_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                trick_name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_latest_session_api_v1_stats_sessions_latest_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    get_session_detail_api_v1_stats_sessions__session_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_lines_api_v1_lines_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    }[];
                };
            };
        };
    };
    create_line_api_v1_lines_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateLineRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_line_api_v1_lines__line_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_line_api_v1_lines__line_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateLineRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_line_api_v1_lines__line_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    record_line_attempt_api_v1_lines__line_id__attempts_post: {
        parameters: {
            query: {
                job_id: string;
                landed?: string;
            };
            header?: never;
            path: {
                line_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    sync_billing_api_v1_billing_sync_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SyncRequest"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SyncResponse"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    revenuecat_webhook_api_v1_webhooks_revenuecat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
}
