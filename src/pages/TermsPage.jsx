import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { LegalSection } from '../components/LegalPage.jsx';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="Terms and Conditions" updated="October 12, 2026">
      <LegalSection id="about" title="About these terms">
        <p>
          These terms govern your use of the Mine Credit website and lay-away
          service. By creating an account or placing a reservation you agree to
          them. If you do not agree, please do not use the service.
        </p>
      </LegalSection>
      <LegalSection id="accounts" title="Accounts">
        <p>
          You must provide accurate name, email and phone details and keep your
          password secure. You are responsible for activity under your account.
          Tell us promptly if you suspect unauthorized use.
        </p>
      </LegalSection>
      <LegalSection id="reservations" title="Reservations">
        <p>
          Reserving a piece holds it for you while your lay-away plan is active.
          A reservation is not a completed sale. The piece stays with Mine
          Credit until the plan is paid in full. Availability and prices are
          shown at the time of reservation.
        </p>
      </LegalSection>
      <LegalSection id="layaway-plans" title="Lay-away plans">
        <ul>
          <li>
            You choose a term of up to [maximum term] months. The price, down
            payment and installment schedule are shown before you confirm.
          </li>
          <li>
            A down payment of [down payment] is due to start the plan. The
            remaining balance is split into the scheduled installments.
          </li>
          <li>
            The total you pay equals the piece price. [Confirm with business: no
            interest or fees.]
          </li>
        </ul>
      </LegalSection>
      <LegalSection id="payments" title="Payments">
        <p>
          Accepted methods are shown at checkout. Payments are confirmed once we
          have verified them, and may show as pending until then. Please pay
          each installment on or before its due date. We may send reminders by
          email or in-app notification.
        </p>
      </LegalSection>
      <LegalSection id="late-payments" title="Late payments">
        <p>
          If an installment is missed we may contact you and allow a grace
          period of [days] days. Repeated missed payments may lead to
          cancellation of the plan.
        </p>
      </LegalSection>
      <LegalSection id="cancellation" title="Cancellation and forfeiture">
        <ul>
          <li>You may ask to cancel a plan at any time by contacting us.</li>
          <li>
            If a plan is cancelled by you or by us for non-payment, the piece is
            released back to inventory. [Refund policy: amounts paid are
            refunded less a [percent]% cancellation fee / retained as store
            credit / forfeited. Business to decide.]
          </li>
        </ul>
      </LegalSection>
      <LegalSection id="delivery" title="Delivery">
        <p>
          The piece is released to you only after the full balance is paid and
          confirmed. Pickup or delivery arrangements will be confirmed with you.
        </p>
      </LegalSection>
      <LegalSection id="pricing" title="Pricing and errors">
        <p>
          We may correct obvious pricing or listing errors. If we do, we will
          contact you before proceeding.
        </p>
      </LegalSection>
      <LegalSection id="liability" title="Limitation of liability">
        <p>
          To the extent permitted by law, Mine Credit is not liable for indirect
          or consequential loss arising from use of the service.
        </p>
      </LegalSection>
      <LegalSection id="changes" title="Changes to these terms">
        <p>
          We may update these terms. The date at the top shows the latest
          version. Plans already in progress stay under the terms in force when
          they were created, unless you agree otherwise.
        </p>
      </LegalSection>
      <LegalSection id="contact" title="Contact">
        <p>
          Questions? Contact us at [support email] or [phone]. See also our{' '}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
      <p>
        Mine Credit is a fictional sample business for demonstration purposes.
      </p>
    </LegalPage>
  );
}
