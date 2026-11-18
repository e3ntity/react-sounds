import React from "react";
import { Link } from "react-router-dom";
import { LegalPage, LegalSection } from "../components/LegalPage";
import { legal } from "../legal";

const PrivacyPage: React.FC = () => {
  const mail = <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>;
  return (
    <LegalPage title="Privacy Policy" updated={legal.privacyUpdated}>
      <LegalSection title="Who is responsible">
        <p>
          The controller under the General Data Protection Regulation (GDPR) is {legal.operatorName}, {legal.country}. Email: {mail}. More details are
          in the <Link to="/imprint">Imprint</Link>.
        </p>
        <p>
          This policy covers the website reactsounds.com. There are no user accounts and no advertising. We use Google Analytics to understand how the
          site is used.
        </p>
      </LegalSection>

      <LegalSection title="Visiting the site">
        <ul>
          <li>
            <strong>Hosting.</strong> The site is stored with DigitalOcean, LLC in Frankfurt, Germany, and delivered through Cloudflare, Inc. Both process
            your IP address and browser details to deliver the pages and protect the site from attacks. We don&apos;t keep server logs of visits. Legal
            basis: our legitimate interest in operating a fast and secure website (Art. 6(1)(f) GDPR).
          </li>
          <li>
            <strong>Sound files.</strong> When you play a sound, it is loaded from DigitalOcean&apos;s content delivery network
            (reactsounds.sfo3.cdn.digitaloceanspaces.com), which processes your IP address to deliver it.
          </li>
          <li>
            <strong>Sound setting.</strong> Whether sounds are on or off is saved in your browser&apos;s local storage (
            <code>react-sounds-enabled</code>). It never leaves your device and is strictly necessary for the setting you choose (§ 25(2) TDDDG).
          </li>
          <li>
            <strong>Google Analytics.</strong> We use Google Analytics 4 by Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Ireland) to see
            which pages are visited and how the site is used. Google Analytics sets cookies (<code>_ga</code>, <code>_ga_*</code>) that recognize your
            browser for up to 2 years, and processes your IP address, which Google uses only to estimate your country and city and doesn&apos;t store. It
            records the pages you visit, your browser, device and screen size, where you came from, and actions on the site: playing, copying or
            downloading a sound, searches that find nothing, and clicks on links to openfoley. Google may process this data in the USA. Legal basis: our
            legitimate interest in improving the site (Art. 6(1)(f) GDPR). Data is deleted after 14 months. You can block the cookies in your browser
            settings or with Google&apos;s <a href="https://tools.google.com/dlpage/gaoptout">opt-out browser add-on</a>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="The react-sounds library">
        <p>
          The react-sounds npm package doesn&apos;t collect any data. Apps that use its built-in sounds load them from the content delivery network
          above, which processes the IP address of the app&apos;s users to deliver the files.
        </p>
      </LegalSection>

      <LegalSection title="Recipients">
        <p>
          <strong>DigitalOcean, LLC</strong> (USA), <strong>Cloudflare, Inc.</strong> (USA) and <strong>Google</strong> (Ireland and USA), as
          described above. Transfers to the USA rely on the EU-U.S. Data Privacy Framework where the recipient is certified, and otherwise on the
          European Commission&apos;s Standard Contractual Clauses (Art. 45 and 46 GDPR). We don&apos;t sell personal data or pass it to anyone else,
          unless the law requires it.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>You have the right to:</p>
        <ul>
          <li>access your data and receive a copy (Art. 15 and 20 GDPR)</li>
          <li>have incorrect data corrected (Art. 16 GDPR)</li>
          <li>have your data deleted (Art. 17 GDPR)</li>
          <li>restrict processing (Art. 18 GDPR)</li>
          <li>
            <strong>object to processing based on legitimate interests (Art. 21 GDPR)</strong>
          </li>
          <li>
            lodge a complaint with a data protection supervisory authority, for example the one where you live or the one responsible for us in{" "}
            {legal.country}
          </li>
        </ul>
        <p>To exercise your rights, email {mail}.</p>
      </LegalSection>
    </LegalPage>
  );
};

export default PrivacyPage;
