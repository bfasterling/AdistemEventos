import { jsPDF } from "jspdf";

export function generateArcoPdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter"
  });

  // Colores y estilos
  const primaryColor = [15, 23, 42]; // Slate 900
  const headerFill = [241, 245, 249]; // Slate 100
  const borderColor = [100, 116, 139]; // Slate 500

  const drawTitleBox = () => {
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(15, 12, 186, 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("SOLICITUD DE EJERCICIO DE DERECHOS ARCO Y REVOCACIÓN DEL CONSENTIMIENTO", 108, 18, { align: "center" });
    doc.text("ASOCIACIÓN DE DISTRIBUIDORES STELLANTIS DE MÉXICO, A.C. (en adelante denominada como “ADISTEM”)", 108, 24, { align: "center" });
  };

  const drawSectionHeader = (title: string, y: number) => {
    doc.setFillColor(headerFill[0], headerFill[1], headerFill[2]);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.rect(15, y, 186, 6, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 108, y + 4.2, { align: "center" });
  };

  // --- PÁGINA 1 ---
  drawTitleBox();

  // Fecha de envío
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Fecha de envío de solicitud", 125, 34);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(166, 30, 35, 6);

  // SECCIÓN: DATOS DEL TITULAR
  drawSectionHeader("DATOS DEL TITULAR", 39);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("NOMBRE DEL TITULAR DE LOS DATOS PERSONALES:", 15, 49);

  // 3 Boxes para nombre
  doc.rect(15, 51, 58, 6);
  doc.rect(73, 51, 58, 6);
  doc.rect(131, 51, 70, 6);
  doc.text("Apellido Paterno", 44, 60, { align: "center" });
  doc.text("Apellido Materno", 102, 60, { align: "center" });
  doc.text("Nombre(s)", 166, 60, { align: "center" });

  doc.text("DOMICILIO DEL TITULAR DE LOS DATOS PERSONALES:", 15, 66);
  // Domicilio fila 1: Calle (80mm), No Ext (25mm), No Int (25mm), Colonia (38mm), CP (18mm)
  doc.rect(15, 68, 76, 6);
  doc.rect(91, 68, 22, 6);
  doc.rect(113, 68, 22, 6);
  doc.rect(135, 68, 48, 6);
  doc.rect(183, 68, 18, 6);
  doc.text("Calle", 53, 77, { align: "center" });
  doc.text("No. Exterior", 102, 77, { align: "center" });
  doc.text("No. Interior", 124, 77, { align: "center" });
  doc.text("Colonia", 159, 77, { align: "center" });
  doc.text("C.P.", 192, 77, { align: "center" });

  // Domicilio fila 2: Alcaldía o Municipio / Entidad Federativa
  doc.rect(15, 80, 93, 6);
  doc.rect(108, 80, 93, 6);
  doc.text("Alcaldía o Municipio", 61, 89, { align: "center" });
  doc.text("Entidad Federativa", 154, 89, { align: "center" });

  // Domicilio fila 3: Teléfono / Correo
  doc.rect(15, 92, 93, 6);
  doc.rect(108, 92, 93, 6);
  doc.text("Teléfono", 61, 101, { align: "center" });
  doc.text("Correo Electrónico", 154, 101, { align: "center" });

  // SECCIÓN: DATOS DEL REPRESENTANTE
  drawSectionHeader("DATOS DEL REPRESENTANTE", 107);
  doc.rect(15, 116, 186, 6);
  doc.text("Nombre completo o Razón social", 108, 125, { align: "center" });

  doc.text("DOMICILIO:", 15, 131);
  doc.rect(15, 133, 76, 6);
  doc.rect(91, 133, 22, 6);
  doc.rect(113, 133, 22, 6);
  doc.rect(135, 133, 48, 6);
  doc.rect(183, 133, 18, 6);
  doc.text("Calle", 53, 142, { align: "center" });
  doc.text("No. Exterior", 102, 142, { align: "center" });
  doc.text("No. Interior", 124, 142, { align: "center" });
  doc.text("Colonia", 159, 142, { align: "center" });
  doc.text("C.P.", 192, 142, { align: "center" });

  doc.rect(15, 145, 93, 6);
  doc.rect(108, 145, 93, 6);
  doc.text("Alcaldía o Municipio", 61, 154, { align: "center" });
  doc.text("Entidad Federativa", 154, 154, { align: "center" });

  doc.rect(15, 157, 93, 6);
  doc.rect(108, 157, 93, 6);
  doc.text("Teléfono", 61, 166, { align: "center" });
  doc.text("Correo Electrónico", 154, 166, { align: "center" });

  // SECCIÓN: DERECHOS QUE EJERCE EL TITULAR O REPRESENTANTE
  drawSectionHeader("DERECHOS QUE EJERCE EL TITULAR O REPRESENTANTE", 172);

  // Checkboxes fila 1: Acceso, Rectificación, Cancelación
  doc.rect(18, 182, 8, 5);
  doc.text("Acceso", 28, 185.5);

  doc.rect(80, 182, 8, 5);
  doc.text("Rectificación", 90, 185.5);

  doc.rect(145, 182, 8, 5);
  doc.text("Cancelación", 155, 185.5);

  // Checkboxes fila 2: Oposición, Revocación del consentimiento
  doc.rect(18, 191, 8, 5);
  doc.text("Oposición", 28, 194.5);

  doc.rect(80, 191, 8, 5);
  doc.text("Revocación del consentimiento", 90, 194.5);

  // SECCIÓN: DESCRIPCIÓN CLARA
  drawSectionHeader("DESCRIPCIÓN CLARA, PRECISA Y DETALLADA DE LOS DATOS PERSONALES RESPECTO DE LOS CUALES ESTÁ EJERCIENDO", 201);
  doc.setFillColor(headerFill[0], headerFill[1], headerFill[2]);
  doc.rect(15, 207, 186, 5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SUS DERECHOS ANTES MENCIONADOS", 108, 210.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const instructions1 = "En caso de solicitud de rectificación, indicar de la manera más detallada posible, donde se encuentran los datos personales que está solicitando rectificar y acompañar con la documentación correspondiente.";
  const instructions2 = "En caso de revocación del consentimiento otorgado, indicar a través de qué medio y la fecha en que se otorgó su consentimiento y las finalidades respecto de las cuales está ejerciendo su derecho de revocación.";

  const lines1 = doc.splitTextToSize(instructions1, 186);
  const lines2 = doc.splitTextToSize(instructions2, 186);
  doc.text(lines1, 15, 216);
  doc.text(lines2, 15, 222);

  // Recuadro grande de descripción
  doc.rect(15, 228, 186, 38);

  // --- PÁGINA 2 ---
  doc.addPage("letter", "portrait");
  drawTitleBox();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Indique los medios a través de los cuales desea recibir las notificaciones vinculadas al ejercicio de sus derechos", 15, 36);

  // Checkboxes de medio de notificación
  doc.rect(18, 40, 8, 5);
  doc.text("Notificación a su domicilio", 28, 43.5);

  doc.rect(85, 40, 8, 5);
  doc.text("Correo electrónico", 95, 43.5);

  doc.rect(130, 39, 71, 6);
  doc.text("Indicar correo electrónico", 165, 48, { align: "center" });

  doc.text("Indicar domicilio completo", 15, 53);
  doc.rect(15, 55, 76, 6);
  doc.rect(91, 55, 22, 6);
  doc.rect(113, 55, 22, 6);
  doc.rect(135, 55, 48, 6);
  doc.rect(183, 55, 18, 6);
  doc.text("Calle", 53, 64, { align: "center" });
  doc.text("No. Exterior", 102, 64, { align: "center" });
  doc.text("No. Interior", 124, 64, { align: "center" });
  doc.text("Colonia", 159, 64, { align: "center" });
  doc.text("C.P.", 192, 64, { align: "center" });

  doc.rect(15, 67, 93, 6);
  doc.rect(108, 67, 93, 6);
  doc.text("Alcaldía o Municipio", 61, 76, { align: "center" });
  doc.text("Entidad Federativa", 154, 76, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("NOTAS:", 15, 86);
  doc.setFont("helvetica", "normal");
  doc.text("El Titular, o en su caso, el Representante legal deberán acompañar la documentación que acredite su identidad y en su caso, la carta", 15, 91);
  doc.text("poder del representante legal", 15, 95.5);

  // Recuadro para firma
  doc.rect(15, 99, 186, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Nombre y firma del Titular o Representante Legal", 108, 149, { align: "center" });

  const declText = "Declaro bajo protesta de decir verdad que los datos expresados en el presente formulario son verdaderos, incluyendo los datos y la documentación que acreditan la identidad del Titular y/o el Representante legal";
  const declLines = doc.splitTextToSize(declText, 186);
  doc.text(declLines, 15, 156);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Aviso de privacidad integral ASOCIACIÓN DE DISTRIBUIDORES STELLANTIS DE MÉXICO, A.C.:", 108, 175, { align: "center" });
  doc.setTextColor(37, 99, 235); // Azul liga
  doc.setFont("helvetica", "bold");
  doc.text("https://adistem-convencion2026.ai.studio/", 108, 180, { align: "center" });

  // Descargar PDF
  doc.save("Solicitud_Derechos_ARCO_ADISTEM.pdf");
}
