'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { MotionConfig, motion, useReducedMotion } from 'framer-motion';

/** Visual defaults, not a frame-rate or accessibility certification. */
export const ISS_SPRINGS = {
  tactile: { type: 'spring' as const, stiffness: 420, damping: 38, mass: 0.8 },
  sheet: { type: 'spring' as const, stiffness: 360, damping: 38, mass: 0.9 },
  gentle: { type: 'spring' as const, stiffness: 260, damping: 34, mass: 1 },
};

/** Import styles/iss-hig-tokens.css once in the application's existing CSS entry. */
export function IssExperienceProvider({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user" transition={ISS_SPRINGS.tactile}>
      <div className={`iss-experience ${className}`.trim()}>{children}</div>
    </MotionConfig>
  );
}

export interface SpatialCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  primaryAction?: React.ReactNode;
  className?: string;
  /** Choose a level appropriate to the containing document. */
  headingLevel?: 2 | 3 | 4;
}

export function SpatialCard({ title, subtitle, badge, children, primaryAction,
  className = '', headingLevel = 2 }: SpatialCardProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <motion.section
      aria-labelledby={titleId}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : ISS_SPRINGS.gentle}
      className={`iss-glass iss-card ${className}`.trim()}
    >
      <header className="iss-card-header">
        <div className="iss-card-title-group">
          {badge && <span className="iss-badge">{badge}</span>}
          <Heading id={titleId} className="iss-card-title">{title}</Heading>
          {subtitle && <p className="iss-secondary iss-card-subtitle">{subtitle}</p>}
        </div>
        {primaryAction && <div className="iss-card-action">{primaryAction}</div>}
      </header>
      {children}
    </motion.section>
  );
}

export interface NarrativeEmptyStateProps {
  /** Decorative; put essential meaning in the headline and guidance. */
  icon?: React.ReactNode;
  headline: string;
  storyGuidance: string;
  ctaLabel: string;
  onAction: () => void;
  headingLevel?: 2 | 3 | 4;
}

export function NarrativeEmptyState({ icon, headline, storyGuidance, ctaLabel,
  onAction, headingLevel = 3 }: NarrativeEmptyStateProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <section className="iss-empty" aria-labelledby={titleId}>
      {icon && <div className="iss-empty-icon" aria-hidden="true">{icon}</div>}
      <Heading id={titleId} className="iss-empty-title">{headline}</Heading>
      <p className="iss-secondary iss-empty-guidance">{storyGuidance}</p>
      <motion.button
        type="button"
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        transition={reduceMotion ? { duration: 0 } : ISS_SPRINGS.tactile}
        onClick={onAction}
        className="iss-button iss-button-primary iss-empty-action"
      >{ctaLabel}</motion.button>
    </section>
  );
}

type PermissionName = 'Location' | 'Bluetooth & Local Mesh' | 'Camera' | 'Notifications';

export interface PermissionPrimerSheetProps {
  isOpen: boolean;
  permissionName: PermissionName;
  userBenefitStory: string;
  /** Specific, accurate collection/use/retention facts; never a blanket guarantee. */
  privacyExplanation: string;
  /**
   * native-essential: only where extra explanation is essential before an OS alert;
   * one Continue button, following Apple HIG. Place optional feature choices outside it.
   * web-optional: contextual web feature explanation; includes Not now.
   */
  mode?: 'native-essential' | 'web-optional';
  /** Called synchronously from the click, preserving transient user activation.
   * This callback must request the actual permission and handle granted/denied results.
   * Opening or rendering this component never requests permission.
   */
  onGrant: () => void | Promise<void>;
  /** Parent must set isOpen=false. Escape is always available to dismiss the dialog. */
  onDefer: () => void;
  onRequestError?: (error: unknown) => void;
}

/**
 * Uses the browser's native modal dialog: top layer, inert background and keyboard
 * containment. Targets modern browsers/WebViews with HTMLDialogElement.showModal.
 * No synthetic success, permission grant, privacy or store-readiness claim is made.
 */
export function PermissionPrimerSheet({ isOpen, permissionName, userBenefitStory,
  privacyExplanation, mode = 'web-optional', onGrant, onDefer, onRequestError,
}: PermissionPrimerSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestPendingRef = useRef(false);
  const lifecycleRef = useRef(0);
  const controlledCloseRef = useRef(false);
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const titleId = useId();
  const benefitId = useId();
  const privacyId = useId();
  const reduceMotion = useReducedMotion();
  const deferRef = useRef(onDefer);
  deferRef.current = onDefer;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    lifecycleRef.current += 1;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRequestError(false);
    if (typeof dialog.showModal !== 'function') {
      setUnsupported(true);
      return;
    }
    setUnsupported(false);
    if (!dialog.open) dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });
    const restoreFocus = () => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
    return () => {
      lifecycleRef.current += 1;
      controlledCloseRef.current = true;
      if (dialog.open) dialog.close();
      restoreFocus();
    };
  }, [isOpen]);

  // Synchronously invoke the request before any await/animation/timer. A denied
  // permission may resolve normally; the consumer must render that actual outcome.
  const requestPermission = () => {
    if (requestPendingRef.current) return;
    requestPendingRef.current = true;
    setPending(true);
    setRequestError(false);
    const requestLifecycle = lifecycleRef.current;
    const fail = (error: unknown) => {
      if (requestLifecycle === lifecycleRef.current) setRequestError(true);
      onRequestError?.(error);
    };
    let operation: void | Promise<void>;
    try { operation = onGrant(); }
    catch (error) {
      fail(error);
      requestPendingRef.current = false;
      setPending(false);
      return;
    }
    Promise.resolve(operation).catch(fail).finally(() => {
      requestPendingRef.current = false;
      setPending(false);
    });
  };

  return (
    <>
      {isOpen && unsupported && (
        <div className="iss-dialog-error">
          <p role="alert">This browser cannot open the permission explanation. Update your browser to use this feature.</p>
          <button type="button" className="iss-button iss-button-secondary" onClick={onDefer}>Close explanation</button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="iss-primer-dialog"
        aria-labelledby={titleId}
        aria-describedby={`${benefitId} ${privacyId}`}
        onCancel={(event) => { event.preventDefault(); deferRef.current(); }}
        onClose={() => {
          if (controlledCloseRef.current) { controlledCloseRef.current = false; return; }
          if (isOpen) deferRef.current();
        }}
      >
        {isOpen && <motion.div
          className="iss-glass iss-primer-content"
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : ISS_SPRINGS.sheet}
        >
          <p className="iss-eyebrow">Device permission</p>
          <h2 ref={headingRef} id={titleId} tabIndex={-1} className="iss-primer-title">
            Use {permissionName}
          </h2>
          <p id={benefitId} className="iss-primer-benefit">{userBenefitStory}</p>
          <p id={privacyId} className="iss-primer-privacy"><strong>How this feature uses your data:</strong> {privacyExplanation}</p>
          {requestError && <p role="alert" className="iss-dialog-error">{mode === 'native-essential'
            ? 'The permission request did not open. Close this explanation and try the feature again when you are ready.'
            : 'The permission request did not open. Try Continue again or choose Not now.'}</p>}
          <div className="iss-primer-actions">
            {mode === 'web-optional' && (
              <button type="button" onClick={onDefer} className="iss-button iss-button-secondary">Not now</button>
            )}
            {requestError && mode === 'native-essential' ? (
              <button type="button" onClick={onDefer} className="iss-button iss-button-secondary">Close explanation</button>
            ) : <motion.button
              type="button"
              disabled={pending}
              onClick={requestPermission}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : ISS_SPRINGS.tactile}
              className="iss-button iss-button-primary"
            >{pending ? 'Opening system prompt…' : 'Continue'}</motion.button>}
          </div>
        </motion.div>}
      </dialog>
    </>
  );
}
