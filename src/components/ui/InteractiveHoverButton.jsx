import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InteractiveHoverButton({ text = 'Get Started', to, className = '', ...props }) {
  const content = <><span className="interactive-hover-label">{text}</span><span className="interactive-hover-copy" data-text={text} aria-hidden="true"><ArrowRight size={15} /></span><span className="interactive-hover-fill" aria-hidden="true" /></>;
  const classes = `interactive-hover-button ${className}`.trim();
  return to ? <Link to={to} className={classes} aria-label={text} {...props}>{content}</Link> : <button type="button" className={classes} aria-label={text} {...props}>{content}</button>;
}
