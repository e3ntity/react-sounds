import React from "react";
import { LegalPage, LegalSection } from "../components/LegalPage";
import { legal } from "../legal";

const ImprintPage: React.FC = () => (
  <LegalPage title="Imprint">
    <LegalSection title="Operator">
      <p>
        react-sounds is a private, non-commercial open source project run by:
        <br />
        {legal.operatorName}
        {legal.postalAddress.map((line) => (
          <span key={line}>
            <br />
            {line}
          </span>
        ))}
        <br />
        {legal.country}
      </p>
      <p>
        Email: <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
      </p>
    </LegalSection>

    <LegalSection title="Responsible for content">
      <p>{legal.operatorName}, contact as above.</p>
    </LegalSection>

    <LegalSection title="Dispute resolution">
      <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
    </LegalSection>
  </LegalPage>
);

export default ImprintPage;
