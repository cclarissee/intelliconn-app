export type TermsSection = {
  title: string;
  body: string;
};

export type TermsContent = {
  title: string;
  version: string;
  lastUpdated: string;
  sections: TermsSection[];
};

export const defaultTerms: TermsContent = {
  title: 'Terms of Service',
  version: '2026-02-12',
  lastUpdated: 'February 12, 2026',
  sections: [
    {
      title: '1. Acceptance of Terms',
      body:
        'By accessing or using Intelliconn, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service.',
    },
    {
      title: '2. Eligibility',
      body:
        'You must be at least 13 years old and legally capable of entering into a binding agreement to use the service.',
    },
    {
      title: '3. Accounts and Security',
      body:
        'You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately of any unauthorized use.',
    },
    {
      title: '4. Service Description',
      body:
        'Intelliconn provides tools to schedule, manage, and publish content across connected social media platforms. We may add, change, or remove features at any time.',
    },
    {
      title: '5. User Content',
      body:
        'You retain ownership of content you submit. You grant Intelliconn a limited license to host, store, and transmit your content solely to provide the service.',
    },
    {
      title: '6. Acceptable Use',
      body:
        'You agree not to:\n' +
        '• Use the service for unlawful or harmful purposes\n' +
        '• Post content that violates others\' rights or applicable laws\n' +
        '• Interfere with or disrupt the service or its security\n' +
        '• Attempt to access accounts or data without authorization\n' +
        '• Use automated tools without our written permission',
    },
    {
      title: '7. Third-Party Services',
      body:
        'Your use of third-party platforms is governed by their terms. Intelliconn is not responsible for third-party services or content.',
    },
    {
      title: '8. Termination',
      body:
        'We may suspend or terminate your access if you violate these terms or if required by law. You may stop using the service at any time.',
    },
    {
      title: '9. Disclaimers',
      body:
        'The service is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted or error-free operation.',
    },
    {
      title: '10. Limitation of Liability',
      body:
        'To the maximum extent permitted by law, Intelliconn will not be liable for indirect, incidental, special, or consequential damages arising from your use of the service.',
    },
    {
      title: '11. Indemnification',
      body:
        'You agree to indemnify and hold Intelliconn harmless from claims arising from your use of the service or violation of these terms.',
    },
    {
      title: '12. Changes to Terms',
      body:
        'We may update these terms from time to time. Material changes will be posted in the app and your continued use constitutes acceptance.',
    },
    {
      title: '13. Contact',
      body:
        'Questions about these terms can be sent to legal@intelliconn.com.',
    },
  ],
};

export function normalizeTerms(data: any): TermsContent {
  const safeString = (value: any, fallback: string) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

  const title = safeString(data?.title, defaultTerms.title);
  const version = safeString(data?.version, defaultTerms.version);
  const lastUpdated = safeString(data?.lastUpdated, defaultTerms.lastUpdated);
  const sections = Array.isArray(data?.sections)
    ? data.sections
        .filter((section: any) => section && typeof section.title === 'string' && typeof section.body === 'string')
        .map((section: any) => ({
          title: section.title.trim(),
          body: section.body.trim(),
        }))
    : defaultTerms.sections;

  return {
    title,
    version,
    lastUpdated,
    sections: sections.length > 0 ? sections : defaultTerms.sections,
  };
}
