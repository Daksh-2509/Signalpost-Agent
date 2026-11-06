export type Company = {
  company_name: string;
  official_website: string;
  social_media_pages: string;
  mentions_company_name_in_news: boolean;
  one_paragraph_summary: string;
};

// Original supplied records. Display formatting never mutates these values.
export const companies: readonly Company[] = [
  {
    company_name: "Fjord Dynamics AS",
    official_website: "https://fjorddynamics.no",
    social_media_pages: "https://linkedin.com/company/fjord-dynamics",
    mentions_company_name_in_news: true,
    one_paragraph_summary: "Fjord Dynamics AS specializes in hydroelectric energy analytics. Based in Trondheim, noted in E24 for our new grid balancing algorithm.",
  },
  {
    company_name: "Oslo HealthTech",
    official_website: "https://oslohealth.tech",
    social_media_pages: "None",
    mentions_company_name_in_news: false,
    one_paragraph_summary: "Oslo HealthTech builds software for patient management. Find us at https://oslohealth.tech. We do not have any social media yet.",
  },
  {
    company_name: "Bergen Seafood Exports",
    official_website: "https://bergenseafood.no",
    social_media_pages: "https://twitter.com/bergenseafood",
    mentions_company_name_in_news: true,
    one_paragraph_summary: "Leading exporter of farmed salmon headquartered in Bergen. Featured in Kyst og Fjord magazine.",
  },
];

export const fieldLabels: Record<keyof Company, string> = {
  company_name: "Company name",
  official_website: "Official website",
  social_media_pages: "Social media",
  mentions_company_name_in_news: "News mentions",
  one_paragraph_summary: "Intelligence summary",
};
