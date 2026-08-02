import CollaborationForm from "./CollaborationForm";
import LeadForm from "./LeadForm";
import WorkshopForm from "./WorkshopForm";

function ContactSelectedForm({ activeCategory }) {
  if (activeCategory === "02") {
    return <CollaborationForm />;
  }

  if (activeCategory === "03") {
    return <WorkshopForm />;
  }

  return <LeadForm />;
}

export default ContactSelectedForm;
