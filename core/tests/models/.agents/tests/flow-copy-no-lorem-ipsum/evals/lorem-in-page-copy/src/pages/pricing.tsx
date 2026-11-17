import { PlanCard } from '../components/plan-card.tsx';

export const PricingPage = () => (
	<main>
		<h1>Simple pricing for every team</h1>
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
		<PlanCard name="Starter" price="$9 / month" />
		<PlanCard name="Business" price="$29 / month" />
		<button type="button">Start your free trial</button>
	</main>
);
