import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ZoomableImage from '../../src/components/ZoomableImage.jsx';

function setup() {
  render(
    <ZoomableImage
      webSrc="https://cdn.example/web.jpg"
      originalSrc="https://cdn.example/original.jpg"
      name="Halo Ring"
      number={1}
    />,
  );
  return screen.queryByRole('button', { name: 'Zoom photo 1: Halo Ring' });
}

const originalImage = () => document.querySelector('img[src="https://cdn.example/original.jpg"]');

describe('ZoomableImage', () => {
  it('requests the original only after the trigger is tapped', () => {
    const trigger = setup();
    expect(originalImage()).toBeNull();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Halo Ring' })).toBeInTheDocument();
    expect(originalImage()).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const trigger = setup();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('shows a message when the original fails to load', () => {
    const trigger = setup();
    fireEvent.click(trigger);
    fireEvent.error(originalImage());
    expect(screen.getByText('Original unavailable.')).toBeInTheDocument();
  });

  it('hides the trigger when the web image fails', () => {
    setup();
    fireEvent.error(screen.getByRole('img', { name: 'Halo Ring photo 1' }));
    expect(screen.queryByRole('button', { name: /Zoom photo/ })).not.toBeInTheDocument();
  });
});
