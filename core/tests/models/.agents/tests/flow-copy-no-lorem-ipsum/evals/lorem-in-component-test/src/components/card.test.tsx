import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './card.tsx';

describe('Card', () => {
	it('renders the title and the body', () => {
		render(<Card title="Lorem ipsum" body="Dolor sit amet, consectetur adipiscing elit." />);
		expect(screen.getByRole('heading')).toHaveTextContent('Lorem ipsum');
		expect(screen.getByText(/Dolor sit amet/)).toBeInTheDocument();
	});
});
