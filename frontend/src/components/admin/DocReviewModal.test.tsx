import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DocReviewModal, type QueueItemData } from "./DocReviewModal";

describe("RF.ADM.1 Admin Document Review Validation", () => {
  const dummyDoc: QueueItemData = {
    id: "doc-1",
    sme_id: "sme-1",
    business_name: "Toko Berkah",
    doc_type: "nib",
    storage_key: "documents/sme-1/nib.pdf",
    status: "pending",
    download_url: "http://localhost:8080/download",
    created_at: "2026-10-30T10:00:00Z",
  };

  it("renders reject button as disabled when review note is empty", () => {
    const html = renderToString(
      React.createElement(DocReviewModal, {
        doc: dummyDoc,
        isOpen: true,
        onClose: () => { },
        onSubmit: async () => { },
      })
    );

    expect(html).toContain('data-testid="admin-reject-button"');
    
    expect(html).toContain("disabled");
  });
});