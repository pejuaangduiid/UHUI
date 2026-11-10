package ojk

// DefaultSCFPartners returns static verified SCF providers according to POJK 17/2025
// as a fail-safe fallback if the database or upstream API is unreachable.
func DefaultSCFPartners() []SCFPartnerDTO {
	return []SCFPartnerDTO{
		{
			ID:            "b1234567-0001-4000-8000-000000000001",
			EntityName:    "PT Investasi Digital Nusantara",
			BrandName:     "Bizhare",
			LicenseNumber: "KEP-71/D.04/2019",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://bizhare.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0002-4000-8000-000000000002",
			EntityName:    "PT Santara Daya Inspiratama",
			BrandName:     "Santara",
			LicenseNumber: "KEP-59/D.04/2019",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://santara.co.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0003-4000-8000-000000000003",
			EntityName:    "PT LBS Urun Dana",
			BrandName:     "LBS Urun Dana",
			LicenseNumber: "KEP-19/D.04/2021",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://lbs.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0004-4000-8000-000000000004",
			EntityName:    "PT Eratani Berdaya Nusantara",
			BrandName:     "Eratani SCF",
			LicenseNumber: "KEP-33/D.04/2022",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://eratani.co.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0005-4000-8000-000000000005",
			EntityName:    "PT Shafiq Digital Indonesia",
			BrandName:     "Shafiq",
			LicenseNumber: "KEP-37/D.04/2021",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://shafiq.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0006-4000-8000-000000000006",
			EntityName:    "PT Numex Teknologi Indonesia",
			BrandName:     "LandX",
			LicenseNumber: "KEP-11/D.04/2020",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://landx.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0007-4000-8000-000000000007",
			EntityName:    "PT Dana Saham Bersama",
			BrandName:     "Danasaham",
			LicenseNumber: "KEP-50/D.04/2020",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://danasaham.co.id",
			IsActive:      true,
		},
		{
			ID:            "b1234567-0008-4000-8000-000000000008",
			EntityName:    "PT Urun Bangun Negeri",
			BrandName:     "FundEx",
			LicenseNumber: "KEP-15/D.04/2021",
			EntityType:    "securities_crowdfunding",
			WebsiteURL:    "https://fundex.id",
			IsActive:      true,
		},
	}
}

// DefaultSampleIllegals provides offline baseline entities from Satgas Waspada Investasi.
func DefaultSampleIllegals() []IllegalEntityDTO {
	return []IllegalEntityDTO{
		{
			ID:             "ill-001",
			EntityName:     "KSP Sahabat Bintang Mandiri Ilegal",
			ActivityType:   "Pinjol & Investasi Bodong",
			SuspicionNotes: "Surat SWI 2024",
		},
		{
			ID:             "ill-002",
			EntityName:     "Investasi Saham Kilat VIP",
			ActivityType:   "Investasi Ilegal Tanpa Izin OJK",
			SuspicionNotes: "Surat SWI 2025",
		},
		{
			ID:             "ill-003",
			EntityName:     "Dana Cepat Kilat Online",
			ActivityType:   "P2P Lending Ilegal",
			SuspicionNotes: "Surat SWI 2023",
		},
	}
}

