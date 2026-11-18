import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IssExperienceProvider, SpatialCard, NarrativeEmptyState, PermissionPrimerSheet } from '../src/components/iss-hig/Primitives';
import '../styles/iss-hig-tokens.css';

declare global {
  interface Window {
    permissionCalls: number;
    activationSeen: boolean;
    finishPermission: () => void;
    rejectPermission: () => void;
    outsideCalls: number;
    actionCalls: number;
  }
}
window.permissionCalls = 0;
window.outsideCalls = 0;
window.actionCalls = 0;
window.activationSeen = false;
function Fixture() {
  const [open, setOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const request = () => {
    window.permissionCalls += 1;
    window.activationSeen = navigator.userActivation.isActive;
    return new Promise<void>((resolve, reject) => {
      window.finishPermission = () => { resolve(); setOpen(false); setNativeOpen(false); };
      window.rejectPermission = () => reject(new Error('Fixture permission service unavailable'));
    });
  };
  return (
    <div data-iss-theme={theme}>
      <IssExperienceProvider>
        <main style={{maxWidth: '60rem', marginInline: 'auto', padding: '1rem'}}>
          <h1>ISS experience component verification</h1>
          <p>This fixture simulates permission requests. It does not access device permissions.</p>
          <div style={{display:'flex', flexWrap:'wrap', gap:'1rem', marginBlock:'1rem'}}>
            <button className="iss-button iss-button-secondary" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle theme</button>
            <button id="open-web" className="iss-button iss-button-primary" type="button" onClick={() => setOpen(true)}>Find nearby resources</button>
            <button id="open-native" className="iss-button iss-button-secondary" type="button" onClick={() => setNativeOpen(true)}>Native essential explanation</button>
            <button id="outside" className="iss-button iss-button-secondary" type="button" onClick={() => {window.outsideCalls += 1;}}>Background action</button>
          </div>
          <SpatialCard title="Your next step" subtitle="Choose a resource to begin planning with your community." badge="Planning" primaryAction={<button type="button" className="iss-button iss-button-secondary">View guide</button>}>
            <NarrativeEmptyState icon={<span>⌖</span>} headline="Start with one useful resource" storyGuidance="Choose a local service and review its current availability before adding it to your plan." ctaLabel="Explore community resources" onAction={() => { window.actionCalls += 1; }} />
          </SpatialCard>
          <PermissionPrimerSheet isOpen={open} permissionName="Location" userBenefitStory="Your location helps sort nearby resources. You can also enter an area manually." privacyExplanation="This fixture does not request or store your location. A production application must describe its actual data use here." onGrant={request} onDefer={() => setOpen(false)} />
          <PermissionPrimerSheet isOpen={nativeOpen} mode="native-essential" permissionName="Camera" userBenefitStory="The next system prompt lets you choose whether this feature can use the camera." privacyExplanation="This fixture does not access the camera or store photographs." onGrant={request} onDefer={() => setNativeOpen(false)} />
        </main>
      </IssExperienceProvider>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<Fixture />);
