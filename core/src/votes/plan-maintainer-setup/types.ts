/** Settings snapshot used only to construct a read-only setup plan. */
export interface SetupSnapshot {
	branch: string;
	allowAutoMerge: boolean;
	protectionBefore: unknown;
	workflow: {
		default_workflow_permissions: string;
		can_approve_pull_request_reviews: boolean;
	};
	labels: { name: string }[];
}
