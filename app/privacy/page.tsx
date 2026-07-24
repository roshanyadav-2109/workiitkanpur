import { LegalFrame, type LegalSection } from "@/components/marketing/legal-frame";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How IITM BS Community collects, uses and protects your data on the OPPE practice platform for the IIT Madras BS Degree.",
  path: "/privacy",
});

const SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    heading: "Introduction",
    body: (
      <>
        <p>
          This Privacy Policy explains how IITM BS Community (&quot;we&quot;,
          &quot;us&quot;, or &quot;our&quot;) collects, uses, shares, and
          safeguards information about you when you access or use our website,
          applications, and related services (together, the &quot;Service&quot;).
          We are committed to handling your information responsibly and in
          accordance with applicable data-protection laws. By using the Service,
          you agree to the collection and use of information in accordance with
          this Policy.
        </p>
        <p>
          IITM BS Community is an independent website operated by an independent
          group of students. It is not run, endorsed, or supported by, and is not
          affiliated with, IIT Madras or the IIT Madras BS Degree programme.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    heading: "Information we collect",
    body: (
      <>
        <p>
          We collect information that you provide directly to us, such as when
          you create an account, update your profile, communicate with us, or
          otherwise interact with the Service. This may include your name, email
          address, sign-in identifiers, and any content or preferences you choose
          to share.
        </p>
        <p>
          If you purchase a paid plan or feature, we and our payment providers
          collect the information needed to process your transaction, such as
          billing details, the plan or items purchased, and transaction records.
          Full payment-card details are handled directly by our third-party
          payment processors and are not stored by us in their entirety.
        </p>
        <p>
          We also collect information automatically as you use the Service,
          including details about your activity, the actions you take, your
          progress and performance, your device and connection, approximate
          location derived from technical identifiers, and similar usage
          information. In addition, we may receive information about you from
          third parties, including our partners, payment providers, and
          authentication providers, which we combine with the information we
          already hold in order to operate and improve the Service.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    heading: "How we use your information",
    body: (
      <>
        <p>
          We use the information we collect to provide, maintain, personalise,
          and improve the Service; to create and administer your account; to
          measure and understand engagement and performance; to communicate with
          you, including about updates, security notices, and offers; to protect
          the security and integrity of the Service and our users; to comply with
          our legal obligations; and to develop new products, features, and
          services. We may also use aggregated or de-identified information,
          which does not identify you personally, for analytics, research, and
          reporting purposes.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How we share information",
    body: (
      <>
        <p>
          We share information with service providers and commercial partners who
          perform functions on our behalf or in collaboration with us, such as
          hosting, infrastructure, analytics, communications, marketing, and
          product development. These recipients are permitted to use your
          information for the purposes for which it is shared and, where required,
          under appropriate contractual arrangements.
        </p>
        <p>
          We may also disclose information in connection with a corporate
          transaction, such as a merger, acquisition, financing, or sale of
          assets, and where we believe disclosure is reasonably necessary to
          comply with applicable law, legal process, or enforceable governmental
          request, to enforce our terms, or to protect the rights, property, or
          safety of our users, our partners, or the public.
        </p>
      </>
    ),
  },
  {
    id: "international",
    heading: "International transfers",
    body: (
      <>
        <p>
          We and our partners and service providers may store and process your
          information in countries other than the one in which you reside, where
          data-protection laws may differ from those of your jurisdiction. Where
          we transfer information across borders, we take steps intended to ensure
          that it continues to be protected in accordance with this Policy and
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "Data retention",
    body: (
      <>
        <p>
          We retain your information for as long as your account remains active or
          as needed to provide the Service, and thereafter for the period
          necessary to satisfy our legitimate business purposes, resolve
          disputes, enforce our agreements, and comply with our legal
          obligations. When information is no longer required, we take reasonable
          steps to delete it or to render it de-identified.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights and choices",
    body: (
      <>
        <p>
          Depending on your location, you may have rights in relation to your
          personal information, including the right to access, correct, update,
          or delete it, to object to or restrict certain processing, and to
          withdraw consent where processing is based on consent. You may also
          manage certain preferences, such as marketing communications, through
          the Service or by contacting us. We will respond to requests in
          accordance with applicable law, and we may need to verify your identity
          before acting on a request.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <>
        <p>
          We maintain administrative, technical, and organisational measures
          designed to protect information against unauthorised access, loss,
          misuse, or alteration. However, no method of transmission or storage is
          completely secure, and we cannot guarantee absolute security. You are
          responsible for keeping your account credentials confidential and for
          notifying us of any suspected unauthorised use of your account.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children's privacy",
    body: (
      <>
        <p>
          The Service is not directed to individuals below the age at which they
          can provide valid consent under applicable law, and we do not knowingly
          collect personal information from such individuals. If we become aware
          that we have collected information in a manner inconsistent with these
          requirements, we will take appropriate steps to delete it.
        </p>
      </>
    ),
  },
  {
    id: "changes-contact",
    heading: "Changes and contact",
    body: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices, technologies, or legal requirements. When we make
          material changes, we will take reasonable steps to notify you, for
          example by updating the date at the top of this page. Your continued use
          of the Service after any changes take effect constitutes your acceptance
          of the updated Policy.
        </p>
        <p>
          If you have any questions or requests regarding this Policy or your
          information, please contact us at{" "}
          <a
            href="mailto:iitmbsdegreestudent@gmail.com"
            className="font-medium text-accent hover:underline"
          >
            iitmbsdegreestudent@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalFrame
      title="Privacy Policy"
      updated="13 July 2026"
      intro="Your privacy matters to us. This Privacy Policy describes the information we collect, how we use and share it, and the choices you have. Please read it carefully to understand our practices."
      sections={SECTIONS}
    />
  );
}
