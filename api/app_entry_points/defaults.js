var fs = require("fs");
var menudefaults = JSON.parse(fs.readFileSync( process.cwd() +"/menudefaults.json"))

module.exports = {
  site_admin_dashboard: "siteadmin_dashboard",
  site_admin_account: [
    {
      path: "settings",
      icon: "settings_applications",
      title: "Settings"
    }
  ],
  site_admin_sidebar: [
    {
      path: "siteadmin_home",
      title: "Processes",
      icon: "home",
      collapse: "autobot"
    }
  ],
  authority_site_dashboard: "authority_dashboard",
  authority_site_account: [
    {
      path: "settings",
      icon: "settings_applications",
      title: "Settings"
     }
  ],
  authority_site_sidebar: menudefaults.authority_site_sidebar,
  creator_site_dashboard: "creator_dashboard",
  creator_site_account: [
    {
      path: "settings",
      icon: "settings_applications",
      title: "Settings"
    }
  ],
  creator_site_sidebar: menudefaults.creator_site_sidebar,
  processes: [
    {
      content_type: "Long Form Article",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Roundup Review",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Info Content",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Alternatives",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "This vs. That",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Question Post",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "How To Post",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Industry Roundup",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Link Share Post",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "text",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Video - Animated Explainer",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "video",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Video - On Screen Persona",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "video",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    },
    {
      content_type: "Podcast",
      suggested_word_count: 0,
      suggested_video_length: 0,
      suggested_bounty: 25,
      media_type: "audio",
      distribution_method: ["Website,Platform,Document"],
      frequency: [
        "Select Frequency",
        "Daily",
        "3x Per Week",
        "Weekly",
        "2x Per Month",
        "Monthly"
      ],
      starting_day: [
        "Select Day",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      short_description: "Repost an image related to these keywords",
      process_description:
        "Find an interesting article related to our keywords",
      editorial_guidelines: [
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link1",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link2",
        "http://www.dropboxurl.com/link/to/editorial/guidelines/link3"
      ]
    }
  ],
  steps: [
    {
      content_type: "Single Review",
      step: "Rough Draft",
      stage: "Production",
      suggested_bounty: 35,
      bounty: 0,
      display_pos: 0,
      step_description:
        "Write the Rough Draft in compliance with our editorial guidelines",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Editing",
      stage: "Production",
      suggested_bounty: 15,
      bounty: 0,
      display_pos: 0,
      step_description: "Edit the content",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Beautification",
      stage: "Production",
      suggested_bounty: 10,
      bounty: 0,
      display_pos: 0,
      step_description: "Format and Beautify the Post for Publication",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Publication",
      stage: "Production",
      suggested_bounty: 5,
      bounty: 0,
      display_pos: 0,
      step_description:
        "Publish the content on the target platform and verify it works",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Video Script",
      stage: "Content Amplification",
      suggested_bounty: 15,
      bounty: 0,
      display_pos: 0,
      step_description: "300-400 word video script",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "On Screen Personality Filming",
      stage: "Content Amplification",
      suggested_bounty: 35,
      bounty: 0,
      display_pos: 0,
      step_description: "A Person Reads a Script",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Editing and Template Integration",
      stage: "Content Amplification",
      suggested_bounty: 10,
      bounty: 0,
      display_pos: 0,
      step_description: "Integrate a video with a template and post",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Internal Linking",
      stage: "SEO",
      suggested_bounty: 20,
      bounty: 0,
      display_pos: 0,
      step_description: "Create internal links",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Social Media",
      stage: "SEO",
      suggested_bounty: 20,
      bounty: 0,
      display_pos: 0,
      step_description: "Share the link on Social Media",
      editorial_guidelines: []
    },
    {
      content_type: "Single Review",
      step: "Link Acquisition",
      stage: "SEO",
      suggested_bounty: 20,
      bounty: 0,
      display_pos: 0,
      step_description: "Get a link from a DR 40+ site",
      editorial_guidelines: []
    }
  ],
  brands: [
    {
      brand_name: "Return Store",
      website_url: "https://www.return.store",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    },
    {
      brand_name: "Too Cute For Me",
      website_url: "https://www.toocuteforme.com",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    },
    {
      brand_name: "The Bored Developer",
      website_url: "https://www.theboreddeveloper.co",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    },
    {
      brand_name: "Content Bounty",
      website_url: "https://www.contentbounty.com",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    },
    {
      brand_name: "Watch Me Bark",
      website_url: "https://www.watchmebark.com",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    },
    {
      brand_name: "Beauty Rhyme",
      website_url: "https://www.return.store",
      new_post_url: "https://www.return.store/newpost.php",
      new_post_login: "iansa4219",
      new_post_pw: "dino",
      monthly_budget: 200,
      social_media: [
        {
          platform: "Instagram",
          login: "Iansa4219",
          pw: "dino"
        }
      ]
    }
  ]
};
