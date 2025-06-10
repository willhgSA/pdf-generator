const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PDF Generator API',
      version: '1.0.0',
      description: 'API for generating PDFs using various templates',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        MediaPlanRequest: {
          type: 'object',
          required: ['status', 'plan_payload'],
          properties: {
            record_id: {
              type: 'string',
              description: 'Airtable record ID to attach the PDF to an existing Airtable record (required if saveToAirtable is true)'
            },
            handlebars_template: {
              type: 'string',
              description: 'Optional: Inline Handlebars template. If provided, this template will be used instead of the folder-based template.'
            },
            status: {
              type: 'string',
              enum: ['needs_improvement', 'approved', 'rejected'],
              description: 'Current status of the media plan'
            },
            improved: {
              type: 'string',
              enum: ['yes', 'no'],
              description: 'Whether the plan has been improved'
            },
            reason: {
              type: 'string',
              description: 'Reason for the current status'
            },
            plan_payload: {
              type: 'object',
              required: ['media_plan', 'budget_total', 'budget_spent', 'budget_remaining', 'general_justification'],
              properties: {
                activecampaignrecord_id: {
                  type: 'string',
                  description: 'Campaign record ID'
                },
                media_plan: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      media_type: {
                        type: 'string',
                        description: 'Type of media (e.g., Digital Publications, Print, Radio/Audio)'
                      },
                      outlets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            mediaoutletrecord_id: {
                              type: 'string',
                              description: 'Media outlet record ID'
                            },
                            mediaoutletname: {
                              type: 'string',
                              description: 'Name of the media outlet'
                            },
                            estimated_reach: {
                              type: 'number',
                              description: 'Estimated reach of the outlet'
                            },
                            budget_allocated: {
                              type: 'number',
                              description: 'Budget allocated to this outlet'
                            },
                            frequency: {
                              type: 'string',
                              description: 'Frequency of the media placement'
                            },
                            justification: {
                              type: 'string',
                              description: 'Justification for using this outlet'
                            },
                            insertionorderinstructions: {
                              type: 'string',
                              description: 'Instructions for the insertion order'
                            },
                            rate_analysis: {
                              type: 'object',
                              properties: {
                                ratesource: {
                                  type: 'string',
                                  description: 'Source of the rate information'
                                },
                                units_affordable: {
                                  type: 'object',
                                  description: 'Units that can be afforded with the budget'
                                },
                                calculation_reference: {
                                  type: 'string',
                                  description: 'Reference for the rate calculation'
                                },
                                selection_justification: {
                                  type: 'string',
                                  description: 'Justification for the rate selection'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                },
                budget_total: {
                  type: 'number',
                  description: 'Total budget for the campaign'
                },
                budget_spent: {
                  type: 'number',
                  description: 'Budget spent so far'
                },
                budget_remaining: {
                  type: 'number',
                  description: 'Remaining budget'
                },
                general_justification: {
                  type: 'object',
                  properties: {
                    targeting: {
                      type: 'string',
                      description: 'Targeting strategy'
                    },
                    geographic_focus: {
                      type: 'string',
                      description: 'Geographic focus of the campaign'
                    },
                    financialefficiencydetail_explained: {
                      type: 'string',
                      description: 'Explanation of financial efficiency'
                    }
                  }
                }
              }
            }
          }
        },
        CampaignSummaryRequest: {
          type: 'object',
          required: ['campaign_id', 'summary_data'],
          properties: {
            campaign_id: {
              type: 'string',
              description: 'Campaign identifier'
            },
            summary_data: {
              type: 'object',
              properties: {
                campaign_name: {
                  type: 'string',
                  description: 'Name of the campaign'
                },
                period: {
                  type: 'string',
                  description: 'Campaign period'
                },
                objectives: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Campaign objectives'
                },
                key_metrics: {
                  type: 'object',
                  properties: {
                    impressions: {
                      type: 'number',
                      description: 'Total impressions'
                    },
                    clicks: {
                      type: 'number',
                      description: 'Total clicks'
                    },
                    conversions: {
                      type: 'number',
                      description: 'Total conversions'
                    },
                    ctr: {
                      type: 'number',
                      description: 'Click-through rate'
                    }
                  }
                }
              }
            }
          }
        },
        BudgetReportRequest: {
          type: 'object',
          required: ['report_id', 'budget_data'],
          properties: {
            report_id: {
              type: 'string',
              description: 'Report identifier'
            },
            budget_data: {
              type: 'object',
              properties: {
                total_budget: {
                  type: 'number',
                  description: 'Total budget amount'
                },
                spent_amount: {
                  type: 'number',
                  description: 'Amount spent'
                },
                remaining_amount: {
                  type: 'number',
                  description: 'Remaining amount'
                },
                allocations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: {
                        type: 'string',
                        description: 'Budget category'
                      },
                      amount: {
                        type: 'number',
                        description: 'Allocated amount'
                      },
                      percentage: {
                        type: 'number',
                        description: 'Percentage of total budget'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        PerformanceMetricsRequest: {
          type: 'object',
          required: ['metrics_id', 'performance_data'],
          properties: {
            metrics_id: {
              type: 'string',
              description: 'Metrics identifier'
            },
            performance_data: {
              type: 'object',
              properties: {
                period: {
                  type: 'string',
                  description: 'Analysis period'
                },
                metrics: {
                  type: 'object',
                  properties: {
                    reach: {
                      type: 'number',
                      description: 'Total reach'
                    },
                    engagement: {
                      type: 'number',
                      description: 'Engagement rate'
                    },
                    roi: {
                      type: 'number',
                      description: 'Return on investment'
                    },
                    cpa: {
                      type: 'number',
                      description: 'Cost per acquisition'
                    }
                  }
                },
                channel_performance: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      channel: {
                        type: 'string',
                        description: 'Channel name'
                      },
                      metrics: {
                        type: 'object',
                        properties: {
                          impressions: {
                            type: 'number',
                            description: 'Channel impressions'
                          },
                          clicks: {
                            type: 'number',
                            description: 'Channel clicks'
                          },
                          conversions: {
                            type: 'number',
                            description: 'Channel conversions'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        PrintInsertionOrderRequest: {
          type: 'object',
          required: [
            'order_number',
            'original_order_date',
            'media_outlet_name',
            'media_outlet_address',
            'contact_name',
            'contact_phone',
            'contact_email',
            'account_executive_name',
            'account_executive_phone',
            'account_executive_email',
            'company_name_from_active_campaign',
            'campaign_title_from_active_campaign',
            'product_or_service',
            'start_date_from_active_campaign',
            'end_date_from_active_campaign',
            'print_placements',
            'total_cost',
            'publication_name',
            'ad_type',
            'position',
            'color_specification',
            'total_insertions',
            'net_rate',
            'production_contact_phone'
          ],
          properties: {
            order_number: {
              type: 'string',
              description: 'Unique identifier for the insertion order'
            },
            original_order_date: {
              type: 'string',
              description: 'Date when the order was created'
            },
            media_outlet_name: {
              type: 'string',
              description: 'Name of the media outlet'
            },
            media_outlet_address: {
              type: 'string',
              description: 'Address of the media outlet'
            },
            contact_name: {
              type: 'string',
              description: 'Name of the contact person at the media outlet'
            },
            contact_phone: {
              type: 'string',
              description: 'Phone number of the contact person'
            },
            contact_email: {
              type: 'string',
              description: 'Email address of the contact person'
            },
            account_executive_name: {
              type: 'string',
              description: 'Name of the Grassroots Media account executive'
            },
            account_executive_phone: {
              type: 'string',
              description: 'Phone number of the account executive'
            },
            account_executive_email: {
              type: 'string',
              description: 'Email address of the account executive'
            },
            company_name_from_active_campaign: {
              type: 'string',
              description: 'Name of the client company'
            },
            campaign_title_from_active_campaign: {
              type: 'string',
              description: 'Title of the advertising campaign'
            },
            product_or_service: {
              type: 'string',
              description: 'Product or service being advertised'
            },
            start_date_from_active_campaign: {
              type: 'string',
              description: 'Start date of the campaign'
            },
            end_date_from_active_campaign: {
              type: 'string',
              description: 'End date of the campaign'
            },
            print_placements: {
              type: 'array',
              description: 'Array of print placement details',
              items: {
                type: 'object',
                required: [
                  'status',
                  'publication_date',
                  'ad_type',
                  'units',
                  'color_specification',
                  'position',
                  'net_rate',
                  'net_cost'
                ],
                properties: {
                  status: {
                    type: 'string',
                    description: 'Status of the placement'
                  },
                  publication_date: {
                    type: 'string',
                    description: 'Date of publication'
                  },
                  ad_type: {
                    type: 'string',
                    description: 'Type of advertisement'
                  },
                  units: {
                    type: 'number',
                    description: 'Number of units'
                  },
                  color_specification: {
                    type: 'string',
                    description: 'Color specifications'
                  },
                  position: {
                    type: 'string',
                    description: 'Position of the advertisement'
                  },
                  net_rate: {
                    type: 'string',
                    description: 'Net rate per insertion'
                  },
                  net_cost: {
                    type: 'string',
                    description: 'Net cost for the placement'
                  }
                }
              }
            },
            total_cost: {
              type: 'string',
              description: 'Total cost of all placements'
            },
            publication_name: {
              type: 'string',
              description: 'Name of the publication'
            },
            ad_type: {
              type: 'string',
              description: 'Type of advertisement'
            },
            position: {
              type: 'string',
              description: 'Position of the advertisement'
            },
            color_specification: {
              type: 'string',
              description: 'Color specifications'
            },
            total_insertions: {
              type: 'number',
              description: 'Total number of insertions'
            },
            net_rate: {
              type: 'string',
              description: 'Net rate per insertion'
            },
            special_instructions: {
              type: 'string',
              description: 'Special instructions for the placement'
            },
            production_contact_phone: {
              type: 'string',
              description: 'Phone number for production inquiries'
            }
          }
        }
      }
    }
  },
  apis: ['./src/index.js'] // Path to the API docs
};

module.exports = swaggerJsdoc(options); 