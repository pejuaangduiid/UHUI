import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TxRow, type TransactionData } from "./TxRow";

describe("RF.TX.1 Transaction Row Reversal Constraints", () => {
  const normalTx: TransactionData = {
    id: "tx-1",
    tx_type: "sale",
    total_amount_idr: 50_000,
    description: "Penjualan beras",
    duplicate_suspect: false,
    is_ocr_verified: true,
    reverses_tx_id: null,
    tx_date: "2026-10-30T10:00:00Z",
  };

  it("shows reverse action button for normal active transaction", () => {
    const html = renderToString(
      React.createElement(TxRow, { tx: normalTx, isReversed: false, onReverse: () => { } })
    );
    expect(html).toContain('data-testid="reverse-button-tx-1"');
  });

  it("hides reverse action button if transaction is already reversed", () => {
    const html = renderToString(
      React.createElement(TxRow, { tx: normalTx, isReversed: true, onReverse: () => { } })
    );
    expect(html).not.toContain('data-testid="reverse-button-tx-1"');
    expect(html).toContain("Sudah Dibalik");
  });

  it("hides reverse action button if transaction is a reversal row", () => {
    const reversalTx: TransactionData = {
      ...normalTx,
      id: "tx-rev-1",
      reverses_tx_id: "tx-1",
      description: "Pembalikan: Penjualan beras",
    };
    const html = renderToString(
      React.createElement(TxRow, { tx: reversalTx, isReversed: false, onReverse: () => { } })
    );
    expect(html).not.toContain('data-testid="reverse-button-tx-rev-1"');
    expect(html).toContain("Pembalikan");
  });
});