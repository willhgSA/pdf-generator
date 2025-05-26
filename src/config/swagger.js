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
        }
      }
    }
  },
  apis: ['./src/index.js'] // Path to the API docs
};

module.exports = swaggerJsdoc(options); 