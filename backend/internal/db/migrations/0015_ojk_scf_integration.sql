-- +goose Up
CREATE TABLE IF NOT EXISTS ojk_licensed_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    entity_type VARCHAR(100) NOT NULL,
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ojk_entity UNIQUE (brand_name, entity_type)
);

CREATE TABLE IF NOT EXISTS ojk_illegal_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(255) NOT NULL,
    entity_aliases TEXT[] DEFAULT '{}',
    activity_type VARCHAR(255) DEFAULT '',
    suspicion_notes TEXT DEFAULT '',
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ojk_illegal_name UNIQUE (entity_name)
);

-- Seed verified official OJK SCF providers per POJK 17/2025
INSERT INTO ojk_licensed_entities (entity_name, brand_name, license_number, entity_type, website_url, is_active)
VALUES
    ('PT Investasi Digital Nusantara', 'Bizhare', 'KEP-71/D.04/2019', 'securities_crowdfunding', 'https://bizhare.id', TRUE),
    ('PT Santara Daya Inspiratama', 'Santara', 'KEP-59/D.04/2019', 'securities_crowdfunding', 'https://santara.co.id', TRUE),
    ('PT LBS Urun Dana', 'LBS Urun Dana', 'KEP-19/D.04/2021', 'securities_crowdfunding', 'https://lbs.id', TRUE),
    ('PT Eratani Berdaya Nusantara', 'Eratani SCF', 'KEP-33/D.04/2022', 'securities_crowdfunding', 'https://eratani.co.id', TRUE),
    ('PT Shafiq Digital Indonesia', 'Shafiq', 'KEP-37/D.04/2021', 'securities_crowdfunding', 'https://shafiq.id', TRUE),
    ('PT Numex Teknologi Indonesia', 'LandX', 'KEP-11/D.04/2020', 'securities_crowdfunding', 'https://landx.id', TRUE),
    ('PT Dana Saham Bersama', 'Danasaham', 'KEP-50/D.04/2020', 'securities_crowdfunding', 'https://danasaham.co.id', TRUE),
    ('PT Urun Bangun Negeri', 'FundEx', 'KEP-15/D.04/2021', 'securities_crowdfunding', 'https://fundex.id', TRUE)
ON CONFLICT (brand_name, entity_type) DO UPDATE SET
    license_number = EXCLUDED.license_number,
    website_url = EXCLUDED.website_url;

-- Seed common sample SWI illegal entities for baseline offline screening
INSERT INTO ojk_illegal_entities (entity_name, entity_aliases, activity_type, suspicion_notes)
VALUES
    ('KSP Sahabat Bintang Mandiri Ilegal', ARRAY['Sahabat Bintang'], 'Pinjol & Investasi Bodong', 'Surat SWI 2024'),
    ('Investasi Saham Kilat VIP', ARRAY['Saham Kilat', 'VIP Profit'], 'Investasi Ilegal Tanpa Izin OJK', 'Surat SWI 2025'),
    ('Dana Cepat Kilat Online', ARRAY['Dana Kilat', 'Cepat Cair'], 'P2P Lending Ilegal', 'Surat SWI 2023')
ON CONFLICT (entity_name) DO NOTHING;

-- Add optional columns to bursa_campaigns
ALTER TABLE bursa_campaigns
ADD COLUMN IF NOT EXISTS scf_partner_id UUID REFERENCES ojk_licensed_entities(id),
ADD COLUMN IF NOT EXISTS ojk_registered_code VARCHAR(100);

-- +goose Down
ALTER TABLE bursa_campaigns
DROP COLUMN IF EXISTS scf_partner_id,
DROP COLUMN IF EXISTS ojk_registered_code;

DROP TABLE IF EXISTS ojk_illegal_entities;
DROP TABLE IF EXISTS ojk_licensed_entities;

