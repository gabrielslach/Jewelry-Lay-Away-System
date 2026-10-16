import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalSection } from '../components/LegalPage.jsx';

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="Privacy Policy" updated="October 12, 2026">
      <LegalSection id="overview" title="Overview">
        <p>
          This policy explains what personal information Mine Credit collects,
          how we use it and your choices.
        </p>
      </LegalSection>
      <LegalSection id="collect" title="Information we collect">
        <ul>
          <li>
            Account details: name, email, phone number and password (stored
            securely, never in plain text).
          </li>
          <li>
            Lay-away details: pieces reserved, plan terms, installment schedules
            and payment status.
          </li>
          <li>
            Payment information: the method you chose and any reference or proof
            of payment you submit. We do not store full card numbers. [Confirm
            with the payment provider.]
          </li>
          <li>
            Technical data: basic device and browser information, and session
            data needed to keep you signed in.
          </li>
        </ul>
      </LegalSection>
      <LegalSection id="use" title="How we use it">
        <p>
          To create and manage your account, process reservations and payments,
          send due-date reminders and receipts, respond to your requests,
          prevent fraud and improve the service.
        </p>
      </LegalSection>
      <LegalSection id="sharing" title="Sharing">
        <p>
          We do not sell your information. We share it only with service
          providers who help us run payments, email and hosting, and where the
          law requires.
        </p>
      </LegalSection>
      <LegalSection id="notifications" title="Notifications">
        <p>
          We send service messages about your plans and payments. These are
          needed to run your plan.
        </p>
      </LegalSection>
      <LegalSection id="retention" title="Retention">
        <p>
          We keep account and plan records while your account is open and for
          [period, e.g. 7 years] afterward for accounting and legal reasons,
          then delete or anonymize them.
        </p>
      </LegalSection>
      <LegalSection id="security" title="Security">
        <p>
          We use reasonable technical and organizational safeguards. No online
          service is completely secure.
        </p>
      </LegalSection>
      <LegalSection id="choices" title="Your choices">
        <p>
          You can view your plans in My Account, change your password, and ask
          us to correct or delete your information, subject to legal
          record-keeping needs.
        </p>
      </LegalSection>
      <LegalSection id="cookies" title="Cookies and storage">
        <p>
          We use essential storage to keep you signed in. [Add analytics
          disclosure if used.]
        </p>
      </LegalSection>
      <LegalSection id="changes" title="Changes">
        <p>We will update the date above when this policy changes.</p>
      </LegalSection>
      <LegalSection id="contact" title="Contact">
        <p>
          Privacy questions: [privacy email]. See also our{' '}
          <Link to="/terms">Terms and Conditions</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
