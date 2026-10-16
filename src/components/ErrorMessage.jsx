import './ErrorMessage.css';

export default function ErrorMessage({ children, ...props }) {
  if (!children) {
    return null;
  }
  return (
    <p className="error-message" role="alert" {...props}>
      {children}
    </p>
  );
}
