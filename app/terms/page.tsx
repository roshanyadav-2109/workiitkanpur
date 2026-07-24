import { LegalFrame, type LegalSection } from "@/components/marketing/legal-frame";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms of use for IITM BS Community, the OPPE practice platform for the IIT Madras BS Degree.",
  path: "/terms",
});

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    heading: "Agreement to these Terms",
    body: (
      <>
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to
          and use of the IITM BS Community website, applications, and related
          services (together, the &quot;Service&quot;). By accessing, browsing,
          registering for, or otherwise using the Service, you confirm that you
          have read, understood, and agree to be bound by these Terms and by any
          policies referenced within them, including our Privacy Policy. If you
          are using the Service on behalf of another person or an organisation,
          you represent that you are authorised to accept these Terms on their
          behalf, and references to &quot;you&quot; include that person or
          organisation.
        </p>
        <p>
          If you do not agree with any part of these Terms, you must not access
          or use the Service. We may make the Service available under additional
          or supplemental terms for particular features from time to time, and
          where those terms conflict with these Terms, the additional terms will
          govern for that feature to the extent of the conflict.
        </p>
        <p>
          IITM BS Community is an independent website created and operated by an
          independent group of students. It is not run, endorsed, sponsored, or
          supported by, and is not affiliated with, IIT Madras or the IIT Madras
          BS Degree programme in any way. Any references to IIT Madras, the BS
          Degree, the OPPE, or related names are used for descriptive and
          identification purposes only and do not imply any association,
          approval, or endorsement.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility and your account",
    body: (
      <>
        <p>
          You must be capable of forming a legally binding contract in your
          jurisdiction in order to use the Service. When you create an account,
          you agree to provide accurate and complete information and to keep that
          information up to date. You are solely responsible for maintaining the
          confidentiality of your account credentials and for all activity that
          occurs under your account, whether or not authorised by you, and you
          agree to notify us promptly of any actual or suspected unauthorised
          use. We may refuse, suspend, or terminate accounts at our discretion,
          including where we reasonably believe that the account has been used in
          breach of these Terms.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "Permitted use of the Service",
    body: (
      <>
        <p>
          We grant you a limited, personal, non-exclusive, non-transferable, and
          revocable licence to access and use the Service for your own lawful
          exam-preparation purposes, subject to these Terms. You agree that you
          will not misuse the Service or help anyone else to do so. In
          particular, and without limiting the generality of the foregoing, you
          agree not to copy, resell, sublicense, or commercially exploit any part
          of the Service; not to attempt to gain unauthorised access to any
          systems, accounts, or data; not to interfere with, disrupt, or place an
          unreasonable load on the Service or its infrastructure; not to use
          automated means to extract or scrape content; and not to use the
          Service to infringe the rights of others or to transmit unlawful,
          harmful, or objectionable material. We reserve the right to investigate
          and take appropriate action against any conduct that we consider, in
          our sole judgement, to violate these Terms or applicable law.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    heading: "Payments, subscriptions and refunds",
    body: (
      <>
        <p>
          Certain features of the Service may be offered on a paid basis, whether
          as one-time purchases or as recurring subscriptions. Where you buy a
          paid plan or feature, you agree to pay all applicable fees and taxes in
          the currency and by the payment methods made available to you at the
          time of purchase. Prices are those displayed at checkout and may change
          from time to time; any change will apply to future purchases and
          renewals only, and not retroactively to a term that you have already
          paid for.
        </p>
        <p>
          Payments are processed on our behalf by third-party payment providers,
          and by making a purchase you authorise us and those providers to charge
          your chosen payment method for the amounts due, including on a recurring
          basis for subscriptions until you cancel. You are responsible for
          providing accurate billing information and keeping it current.
          Subscriptions renew automatically at the end of each billing cycle
          unless you cancel before the renewal date, and any cancellation takes
          effect at the end of the then-current paid period. Except where required
          by applicable law or expressly stated by us in writing, fees are
          non-refundable and all purchases are final. If you believe you have been
          charged in error, please contact us and we will review your request in
          good faith.
        </p>
      </>
    ),
  },
  {
    id: "content",
    heading: "Content and intellectual property",
    body: (
      <>
        <p>
          All materials made available through the Service, including questions,
          explanations, curricula, text, graphics, logos, and software, together
          with the selection, arrangement, and presentation of those materials,
          are owned by us or our licensors and are protected by intellectual
          property laws. Except for the limited licence expressly granted to you
          in these Terms, no right, title, or interest in the Service or its
          content is transferred to you, and all rights not expressly granted are
          reserved.
        </p>
        <p>
          Where the Service allows you to submit content, such as solutions,
          notes, or feedback, you retain ownership of your content but grant us a
          worldwide, royalty-free, sublicensable, and transferable licence to
          host, store, reproduce, and use that content for the purpose of
          operating, improving, and promoting the Service. You are responsible
          for ensuring that any content you submit does not infringe the rights
          of any third party and complies with these Terms.
        </p>
      </>
    ),
  },
  {
    id: "partners",
    heading: "Third parties and data transfers",
    body: (
      <>
        <p>
          The Service relies on trusted third-party providers and commercial
          partners to operate, deliver, secure, analyse, and improve our
          offering. By using the Service, you acknowledge and agree that
          information relating to you and your use of the Service, including
          personal data and activity data, may be shared with and transferred to
          our partners, service providers, affiliates, and successors, including
          for the purposes of hosting, analytics, communications, advertising,
          research, and the development of new products and features. Such
          transfers may include disclosure to, and processing by, partners
          located in countries other than your own, and by using the Service you
          consent to these transfers as described here and in our Privacy Policy.
        </p>
        <p>
          Where the Service contains links to, or integrations with, third-party
          websites or services, those third parties operate under their own terms
          and policies, and we are not responsible for their content, practices,
          or the manner in which they handle information once it has been
          transferred to them.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <>
        <p>
          The Service and all content are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis, without warranties of any kind, whether
          express, implied, or statutory, including any implied warranties of
          merchantability, fitness for a particular purpose, accuracy, or
          non-infringement. We do not warrant that the Service will be
          uninterrupted, timely, secure, or error-free, or that any content,
          including questions and model answers, is complete, current, or free
          from mistakes. The Service is intended to support your preparation and
          does not guarantee any particular examination result or outcome, and
          nothing on the Service constitutes professional, academic, or legal
          advice.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by applicable law, we and our
          affiliates, partners, and suppliers will not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or
          for any loss of profits, revenue, data, goodwill, or other intangible
          losses, arising out of or in connection with your use of, or inability
          to use, the Service, whether based in contract, tort, negligence,
          strict liability, or any other legal theory, and whether or not we have
          been advised of the possibility of such damages. To the extent any
          liability cannot be excluded, our total aggregate liability arising out
          of or relating to the Service will be limited to the amount you have
          paid us, if any, for access to the Service in the twelve months
          preceding the event giving rise to the liability.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: (
      <>
        <p>
          We may suspend or terminate your access to all or part of the Service
          at any time, with or without notice, including where we reasonably
          believe you have breached these Terms or where we discontinue the
          Service. You may stop using the Service and request closure of your
          account at any time. Provisions that by their nature should survive
          termination, including those relating to intellectual property,
          disclaimers, limitation of liability, and governing law, will continue
          to apply after your access ends.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these Terms",
    body: (
      <>
        <p>
          We may update or revise these Terms from time to time to reflect
          changes in our Service, our business, or applicable law. When we make
          material changes, we will take reasonable steps to notify you, for
          example by updating the date at the top of this page or by other
          appropriate means. Your continued use of the Service after any changes
          take effect constitutes your acceptance of the revised Terms, and if
          you do not agree to the changes you should stop using the Service.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing law and contact",
    body: (
      <>
        <p>
          These Terms and any dispute or claim arising out of or in connection
          with them or their subject matter are governed by, and construed in
          accordance with, the laws of India, and the courts located in India
          will have jurisdiction, without prejudice to any mandatory consumer
          protections available to you under the laws of your place of residence.
        </p>
        <p>
          If you have any questions about these Terms, please contact us at{" "}
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

export default function TermsPage() {
  return (
    <LegalFrame
      title="Terms &amp; Conditions"
      updated="13 July 2026"
      intro="Please read these Terms & Conditions carefully before using IITM BS Community. They set out the rules that apply to your use of our website and services and form a binding agreement between you and us."
      sections={SECTIONS}
    />
  );
}
