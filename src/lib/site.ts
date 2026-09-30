// Contacto público de la doctora. Las citas las agenda ella desde su portal; la landing solo dirige a WhatsApp.
export const CONTACT = {
  whatsappNumber: "+1 (849) 591-2572",
  whatsappUsername: "@Dra.MirianGalan",
  instagram: "https://www.instagram.com/dra.miriangalan.nutricion/",
  instagramHandle: "@dra.miriangalan.nutricion",
  tiktok: "https://www.tiktok.com/@dramiriangalan",
};

/** Enlace de WhatsApp con mensaje prellenado. */
export function whatsappLink(text = "Hola Dra. Galán, me gustaría agendar una consulta.") {
  return `https://wa.me/18495912572?text=${encodeURIComponent(text)}`;
}
