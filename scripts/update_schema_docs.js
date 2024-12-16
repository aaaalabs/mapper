import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateSchemaDefinitions() {
  const schemaPath = path.join(__dirname, '..', 'schema_definitions.json');
  
  try {
    // Read current schema definitions to preserve project metadata
    const currentSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    
    // Preserve project and feature documentation
    const { project } = currentSchema;
    
    // Get the schema content from the JSON export
    const schemaContent = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', 'map_schemas.sql'),
      'utf8'
    );

    // Parse the schema content
    const schemas = {
      core: {
        maps: {
          description: "Main table for storing community maps",
          fields: {
            id: { type: "uuid", primary: true },
            name: { type: "text", nullable: false },
            members: { type: "jsonb", nullable: false },
            center: { type: "numeric[]", nullable: false },
            zoom: { type: "int4", nullable: false },
            created_at: { type: "timestamptz", nullable: false },
            settings: { type: "jsonb" }
          },
          indexes: ["idx_maps_created_at"]
        },
        map_user_roles: {
          description: "Manages user roles and permissions",
          fields: {
            id: { type: "uuid", primary: true },
            user_id: { type: "uuid", unique: true },
            role: { type: "text", nullable: false },
            email: { type: "text", nullable: false },
            created_at: { type: "timestamptz" },
            updated_at: { type: "timestamptz" }
          }
        }
      },
      analytics: {
        map_analytics: {
          description: "Stores map usage statistics",
          fields: {
            id: { type: "uuid", primary: true },
            map_id: { type: "uuid", references: "maps(id)" },
            total_members: { type: "int4", nullable: false },
            unique_locations: { type: "int4", nullable: false },
            download_count: { type: "int4" },
            share_count: { type: "int4" },
            created_at: { type: "timestamptz" }
          }
        },
        map_analytics_events: {
          description: "Detailed event tracking",
          fields: {
            id: { type: "uuid", primary: true },
            event_name: { type: "text", nullable: false },
            session_id: { type: "text" },
            created_at: { type: "timestamptz" },
            timestamp: { type: "timestamptz" },
            metadata: { type: "jsonb" },
            feature_name: { type: "text" },
            feature_metadata: { type: "jsonb" },
            error_type: { type: "text" },
            error_message: { type: "text" },
            performance_data: { type: "jsonb" }
          },
          indexes: [
            "idx_analytics_error_type",
            "idx_analytics_performance",
            "idx_analytics_session_timestamp",
            "idx_analytics_feature_name",
            "idx_analytics_created_at"
          ]
        }
      },
      feedback: {
        map_feedback: {
          description: "User feedback and testimonials",
          fields: {
            id: { type: "uuid", primary: true },
            map_id: { type: "uuid", references: "maps(id)", nullable: false },
            satisfaction_rating: { type: "int4", nullable: false },
            testimonial: { type: "text" },
            use_case: { type: "text" },
            community_type: { type: "text" },
            organization_name: { type: "text" },
            contact_email: { type: "text" },
            can_feature: { type: "bool" },
            created_at: { type: "timestamptz" },
            updated_at: { type: "timestamptz" },
            status: { type: "varchar(50)" },
            session_id: { type: "text" }
          },
          indexes: [
            "idx_feedback_session",
            "idx_map_feedback_status",
            "idx_map_feedback_rating_created"
          ]
        },
        map_leads: {
          description: "Lead management",
          fields: {
            id: { type: "uuid", primary: true },
            email: { type: "text", nullable: false },
            name: { type: "text", nullable: false },
            community_link: { type: "text" },
            lead_type: { type: "text", nullable: false, check: "IN ('beta_waitlist', 'data_extraction')" },
            status: { type: "text", nullable: false, check: "IN ('pending', 'contacted', 'converted', 'rejected')" },
            map_id: { type: "uuid", references: "maps(id)" },
            feedback_id: { type: "uuid", references: "map_feedback(id)" },
            notes: { type: "text" },
            metadata: { type: "jsonb" },
            created_at: { type: "timestamptz" },
            updated_at: { type: "timestamptz" },
            last_contacted_at: { type: "timestamptz" },
            next_followup_at: { type: "timestamptz" }
          },
          indexes: [
            "map_leads_email_idx",
            "map_leads_type_idx",
            "map_leads_status_idx",
            "map_leads_next_followup_idx",
            "idx_map_leads_status_created"
          ]
        }
      },
      logging: {
        map_system_logs: {
          description: "System-wide logging",
          fields: {
            id: { type: "uuid", primary: true },
            level: { type: "text", nullable: false },
            message: { type: "text", nullable: false },
            metadata: { type: "jsonb" },
            timestamp: { type: "timestamptz" },
            priority: { type: "text" }
          },
          indexes: ["idx_system_logs_timestamp"]
        }
      },
      views: {
        map_analytics_summary: {
          description: "Daily aggregation of events, sessions, errors, and load times",
          source: "map_analytics_events",
          aggregates: ["total_events", "unique_sessions", "error_count", "avg_load_time"],
          group_by: ["day", "event_name"]
        },
        map_performance_analytics: {
          description: "Hourly performance metrics",
          source: "map_analytics_events",
          aggregates: ["avg_load_time", "avg_render_time", "session_count"],
          group_by: ["hour"]
        },
        map_error_analytics: {
          description: "Daily error aggregation",
          source: "map_analytics_events",
          aggregates: ["error_count", "affected_sessions", "most_common_error"],
          group_by: ["error_type", "day"]
        },
        map_feedback_metrics: {
          description: "Daily feedback metrics",
          source: "map_feedback",
          aggregates: ["total_feedback", "avg_rating"],
          group_by: ["day"]
        }
      }
    };
    
    // Update the schema definitions
    const updatedSchema = {
      timestamp: new Date().toISOString(),
      project,
      database: {
        name: 'mapper',
        version: 'PostgreSQL 15',
        extensions: ['postgis', 'uuid-ossp'],
        schemas
      }
    };

    // Write updated schema back to file
    fs.writeFileSync(
      schemaPath,
      JSON.stringify(updatedSchema, null, 2),
      'utf8'
    );

    console.log('✅ Schema definitions updated successfully');
  } catch (error) {
    console.error('❌ Error updating schema definitions:', error);
    process.exit(1);
  }
}

// Add this script to package.json scripts
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['update-schema'] = 'node scripts/update_schema_docs.js';
  packageJson.scripts['postmigrate'] = 'npm run update-schema';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added schema update scripts to package.json');
} catch (error) {
  console.error('❌ Error updating package.json:', error);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateSchemaDefinitions();
}
