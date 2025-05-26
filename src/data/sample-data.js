const sampleData = {
    title: "Grassroots Media Plan for Bank of America Multicultural Campaign",
    subtitle: "Q4 2023 Campaign Overview",
    generatedDate: new Date().toLocaleDateString(),
    mediaTypes: [
        {
            type: "Digital",
            items: [
                {
                    title: "Social Media Campaign",
                    channel: "Instagram, Facebook, Twitter",
                    duration: "6 weeks",
                    targetAudience: "Hispanic Millennials",
                    description: "Native content and influencer partnerships",
                    metrics: [
                        { label: "Reach", value: "2.5M" },
                        { label: "Engagement", value: "15%" },
                        { label: "CTR", value: "3.2%" }
                    ]
                },
                {
                    title: "Programmatic Display",
                    channel: "Display Networks",
                    duration: "8 weeks",
                    targetAudience: "African American Professionals",
                    description: "Contextual targeting on financial websites",
                    metrics: [
                        { label: "Impressions", value: "5M" },
                        { label: "CTR", value: "1.8%" },
                        { label: "Conversions", value: "2.5%" }
                    ]
                }
            ]
        },
        {
            type: "Print",
            items: [
                {
                    title: "Local Newspaper Ads",
                    channel: "Major City Newspapers",
                    duration: "4 weeks",
                    targetAudience: "Asian American Community",
                    description: "Full-page advertisements in local newspapers",
                    metrics: [
                        { label: "Circulation", value: "500K" },
                        { label: "Readership", value: "1.2M" }
                    ]
                }
            ]
        },
        {
            type: "TV",
            items: [
                {
                    title: "Cable Network Spots",
                    channel: "Univision, Telemundo",
                    duration: "12 weeks",
                    targetAudience: "Hispanic Families",
                    description: "30-second spots during prime time",
                    metrics: [
                        { label: "GRP", value: "250" },
                        { label: "Reach", value: "3.5M" },
                        { label: "Frequency", value: "4.2" }
                    ]
                }
            ]
        },
        {
            type: "Radio",
            items: [
                {
                    title: "Local Radio Campaign",
                    channel: "Urban and Ethnic Radio Stations",
                    duration: "8 weeks",
                    targetAudience: "African American Adults",
                    description: "60-second spots during drive time",
                    metrics: [
                        { label: "Reach", value: "1.8M" },
                        { label: "Frequency", value: "3.5" }
                    ]
                }
            ]
        }
    ],
    footerText: "Bank of America - Confidential",
    pageNumber: 1,
    totalPages: 1
};

module.exports = sampleData; 