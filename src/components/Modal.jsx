import { useEffect, useRef } from 'react';
import { CloseIcon } from '../theme/assets.js';
import './Modal.css';

const openModals = [];

export default function Modal({ title, children, footer, onClose }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const self = {};
    openModals.push(self);
    function onKeyDown(event) {
      if (event.key === 'Escape' && openModals.at(-1) === self) {
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openModals.splice(openModals.indexOf(self), 1);
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <h3 id="modal-title">{title}</h3>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <CloseIcon title="" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
