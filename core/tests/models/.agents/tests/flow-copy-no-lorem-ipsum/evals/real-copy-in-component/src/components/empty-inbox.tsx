export const EmptyInbox = ({ onCompose }: { onCompose: () => void }) => (
	<section className="empty-inbox">
		<h2>You're all caught up</h2>
		<p>New messages from your team will show up here.</p>
		<button type="button" onClick={onCompose}>
			Write a message
		</button>
	</section>
);
