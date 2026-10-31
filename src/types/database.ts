
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "categories": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es"?: string | null
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"custom_users": {
                  Row: {
                    "active_split_id": string | null,"avatar_url": string | null,"bio": string | null,"created_at": string,"first_name": string | null,"id": string,"language": string,"last_name": string | null,"profile_privacy": Database["public"]['Enums']["profile_privacy"],"updated_at": string,"user_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active_split_id"?: string | null,"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"first_name"?: string | null,"id": string,"language"?: string,"last_name"?: string | null,"profile_privacy"?: Database["public"]['Enums']["profile_privacy"],"updated_at"?: string,"user_name"?: string | null
                  }
                  Update: {
                    "active_split_id"?: string | null,"avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"first_name"?: string | null,"id"?: string,"language"?: string,"last_name"?: string | null,"profile_privacy"?: Database["public"]['Enums']["profile_privacy"],"updated_at"?: string,"user_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_users_active_split_id_fkey"
      columns: ["active_split_id"]
isOneToOne: false
      referencedRelation: "splits"
      referencedColumns: ["id"]
    }
                  ]
                },"equipment": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es"?: string | null
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"exercise_names": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es"?: string | null
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"exercise_secondary_muscles": {
                  Row: {
                    "exercise_id": string,"muscle_group_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "exercise_id": string,"muscle_group_id": string
                  }
                  Update: {
                    "exercise_id"?: string,"muscle_group_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_secondary_muscles_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "gymbro_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_secondary_muscles_muscle_group_id_fkey"
      columns: ["muscle_group_id"]
isOneToOne: false
      referencedRelation: "muscle_groups"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "category": string | null,"created_at": string | null,"equipment": string | null,"gif_url": string | null,"id": string,"image": string | null,"instructions_en": string | null,"instructions_es": string | null,"instructions_hi": string | null,"instructions_it": string | null,"instructions_ko": string | null,"instructions_pl": string | null,"instructions_ru": string | null,"instructions_tr": string | null,"instructions_zh": string | null,"muscle_group": string | null,"name": string,"secondary_muscles": Json | null,"target": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string | null,"equipment"?: string | null,"gif_url"?: string | null,"id": string,"image"?: string | null,"instructions_en"?: string | null,"instructions_es"?: string | null,"instructions_hi"?: string | null,"instructions_it"?: string | null,"instructions_ko"?: string | null,"instructions_pl"?: string | null,"instructions_ru"?: string | null,"instructions_tr"?: string | null,"instructions_zh"?: string | null,"muscle_group"?: string | null,"name": string,"secondary_muscles"?: Json | null,"target"?: string | null
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string | null,"equipment"?: string | null,"gif_url"?: string | null,"id"?: string,"image"?: string | null,"instructions_en"?: string | null,"instructions_es"?: string | null,"instructions_hi"?: string | null,"instructions_it"?: string | null,"instructions_ko"?: string | null,"instructions_pl"?: string | null,"instructions_ru"?: string | null,"instructions_tr"?: string | null,"instructions_zh"?: string | null,"muscle_group"?: string | null,"name"?: string,"secondary_muscles"?: Json | null,"target"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"friendships": {
                  Row: {
                    "addressee_id": string,"created_at": string,"id": string,"requester_id": string,"status": Database["public"]['Enums']["friendship_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"id"?: string,"requester_id": string,"status"?: Database["public"]['Enums']["friendship_status"],"updated_at"?: string
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["friendship_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "friendships_addressee_id_fkey"
      columns: ["addressee_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "friendships_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"gymbro_exercises": {
                  Row: {
                    "category_id": string | null,"equipment_id": string | null,"exercise_id": string,"exercise_name_id": string,"gif_url": string | null,"id": string,"image": string | null,"instructions_en": string | null,"instructions_es": string | null,"muscle_group_id": string | null,"target_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"equipment_id"?: string | null,"exercise_id": string,"exercise_name_id": string,"gif_url"?: string | null,"id"?: string,"image"?: string | null,"instructions_en"?: string | null,"instructions_es"?: string | null,"muscle_group_id"?: string | null,"target_id"?: string | null
                  }
                  Update: {
                    "category_id"?: string | null,"equipment_id"?: string | null,"exercise_id"?: string,"exercise_name_id"?: string,"gif_url"?: string | null,"id"?: string,"image"?: string | null,"instructions_en"?: string | null,"instructions_es"?: string | null,"muscle_group_id"?: string | null,"target_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gymbro_exercises_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gymbro_exercises_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gymbro_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: true
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gymbro_exercises_exercise_name_id_fkey"
      columns: ["exercise_name_id"]
isOneToOne: false
      referencedRelation: "exercise_names"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gymbro_exercises_muscle_group_id_fkey"
      columns: ["muscle_group_id"]
isOneToOne: false
      referencedRelation: "muscle_groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gymbro_exercises_target_id_fkey"
      columns: ["target_id"]
isOneToOne: false
      referencedRelation: "targets"
      referencedColumns: ["id"]
    }
                  ]
                },"muscle_groups": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es"?: string | null
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"routine_exercise_sets": {
                  Row: {
                    "created_at": string,"id": string,"max_reps": number | null,"min_reps": number | null,"position": number,"rir": number | null,"routine_exercise_id": string,"updated_at": string,"weight": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"max_reps"?: number | null,"min_reps"?: number | null,"position": number,"rir"?: number | null,"routine_exercise_id": string,"updated_at"?: string,"weight"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"max_reps"?: number | null,"min_reps"?: number | null,"position"?: number,"rir"?: number | null,"routine_exercise_id"?: string,"updated_at"?: string,"weight"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "routine_exercise_sets_routine_exercise_id_fkey"
      columns: ["routine_exercise_id"]
isOneToOne: false
      referencedRelation: "routine_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"routine_exercises": {
                  Row: {
                    "created_at": string,"gymbro_exercise_id": string,"id": string,"notes": string | null,"position": number,"routine_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"gymbro_exercise_id": string,"id"?: string,"notes"?: string | null,"position": number,"routine_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"gymbro_exercise_id"?: string,"id"?: string,"notes"?: string | null,"position"?: number,"routine_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "routine_exercises_gymbro_exercise_id_fkey"
      columns: ["gymbro_exercise_id"]
isOneToOne: false
      referencedRelation: "gymbro_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "routine_exercises_routine_id_fkey"
      columns: ["routine_id"]
isOneToOne: false
      referencedRelation: "routines"
      referencedColumns: ["id"]
    }
                  ]
                },"routines": {
                  Row: {
                    "archived_at": string | null,"color": string | null,"created_at": string,"id": string,"name": string,"position": number,"privacy": Database["public"]['Enums']["profile_privacy"],"source_routine_id": string | null,"split_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"id"?: string,"name": string,"position": number,"privacy"?: Database["public"]['Enums']["profile_privacy"],"source_routine_id"?: string | null,"split_id": string,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"color"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"position"?: number,"privacy"?: Database["public"]['Enums']["profile_privacy"],"source_routine_id"?: string | null,"split_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "routines_source_routine_id_fkey"
      columns: ["source_routine_id"]
isOneToOne: false
      referencedRelation: "routines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "routines_split_id_fkey"
      columns: ["split_id"]
isOneToOne: false
      referencedRelation: "splits"
      referencedColumns: ["id"]
    }
                  ]
                },"splits": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"id": string,"name": string,"privacy": Database["public"]['Enums']["profile_privacy"],"source_split_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name": string,"privacy"?: Database["public"]['Enums']["profile_privacy"],"source_split_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"privacy"?: Database["public"]['Enums']["profile_privacy"],"source_split_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "splits_source_split_id_fkey"
      columns: ["source_split_id"]
isOneToOne: false
      referencedRelation: "splits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "splits_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"targets": {
                  Row: {
                    "id": string,"name_en": string,"name_es": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name_en": string,"name_es"?: string | null
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_es"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"trainer_applications": {
                  Row: {
                    "applicant_id": string,"created_at": string,"id": string,"message": string | null,"response_message": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["trainer_application_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applicant_id": string,"created_at"?: string,"id"?: string,"message"?: string | null,"response_message"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["trainer_application_status"],"updated_at"?: string
                  }
                  Update: {
                    "applicant_id"?: string,"created_at"?: string,"id"?: string,"message"?: string | null,"response_message"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["trainer_application_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainer_applications_applicant_id_fkey"
      columns: ["applicant_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"trainer_assignments": {
                  Row: {
                    "created_at": string,"gymbro_id": string,"id": string,"imported_split_id": string | null,"responded_at": string | null,"split_id": string,"status": Database["public"]['Enums']["assignment_status"],"trainer_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"gymbro_id": string,"id"?: string,"imported_split_id"?: string | null,"responded_at"?: string | null,"split_id": string,"status"?: Database["public"]['Enums']["assignment_status"],"trainer_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"gymbro_id"?: string,"id"?: string,"imported_split_id"?: string | null,"responded_at"?: string | null,"split_id"?: string,"status"?: Database["public"]['Enums']["assignment_status"],"trainer_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainer_assignments_gymbro_id_fkey"
      columns: ["gymbro_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_assignments_imported_split_id_fkey"
      columns: ["imported_split_id"]
isOneToOne: false
      referencedRelation: "splits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_assignments_split_id_fkey"
      columns: ["split_id"]
isOneToOne: false
      referencedRelation: "splits"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_assignments_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"trainer_gymbros": {
                  Row: {
                    "created_at": string,"gymbro_id": string,"id": string,"status": Database["public"]['Enums']["trainer_gymbro_status"],"trainer_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"gymbro_id": string,"id"?: string,"status"?: Database["public"]['Enums']["trainer_gymbro_status"],"trainer_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"gymbro_id"?: string,"id"?: string,"status"?: Database["public"]['Enums']["trainer_gymbro_status"],"trainer_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trainer_gymbros_gymbro_id_fkey"
      columns: ["gymbro_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "trainer_gymbros_trainer_id_fkey"
      columns: ["trainer_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"user_roles": {
                  Row: {
                    "created_at": string,"id": string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"role": Database["public"]['Enums']["app_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"role"?: Database["public"]['Enums']["app_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"user_socials": {
                  Row: {
                    "created_at": string,"id": string,"platform": string,"url": string | null,"user_id": string,"username": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"platform": string,"url"?: string | null,"user_id": string,"username": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"platform"?: string,"url"?: string | null,"user_id"?: string,"username"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_socials_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_exercises": {
                  Row: {
                    "created_at": string,"gymbro_exercise_id": string,"id": string,"notes_snapshot": string | null,"position": number,"routine_exercise_id": string | null,"updated_at": string,"workout_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"gymbro_exercise_id": string,"id"?: string,"notes_snapshot"?: string | null,"position": number,"routine_exercise_id"?: string | null,"updated_at"?: string,"workout_id": string
                  }
                  Update: {
                    "created_at"?: string,"gymbro_exercise_id"?: string,"id"?: string,"notes_snapshot"?: string | null,"position"?: number,"routine_exercise_id"?: string | null,"updated_at"?: string,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercises_gymbro_exercise_id_fkey"
      columns: ["gymbro_exercise_id"]
isOneToOne: false
      referencedRelation: "gymbro_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_exercises_routine_exercise_id_fkey"
      columns: ["routine_exercise_id"]
isOneToOne: false
      referencedRelation: "routine_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_exercises_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sets": {
                  Row: {
                    "completed": boolean,"created_at": string,"id": string,"position": number,"reps": number | null,"updated_at": string,"weight": number | null,"workout_exercise_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed"?: boolean,"created_at"?: string,"id"?: string,"position": number,"reps"?: number | null,"updated_at"?: string,"weight"?: number | null,"workout_exercise_id": string
                  }
                  Update: {
                    "completed"?: boolean,"created_at"?: string,"id"?: string,"position"?: number,"reps"?: number | null,"updated_at"?: string,"weight"?: number | null,"workout_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sets_workout_exercise_id_fkey"
      columns: ["workout_exercise_id"]
isOneToOne: false
      referencedRelation: "workout_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"workouts": {
                  Row: {
                    "created_at": string,"finished_at": string | null,"id": string,"routine_id": string | null,"started_at": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"finished_at"?: string | null,"id"?: string,"routine_id"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"finished_at"?: string | null,"id"?: string,"routine_id"?: string | null,"started_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workouts_routine_id_fkey"
      columns: ["routine_id"]
isOneToOne: false
      referencedRelation: "routines"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workouts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "custom_users"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_trainer_assignment":
{ Args: { "p_assignment_id": string }; Returns: string
                           },
"add_routine_exercises":
{ Args: { "p_gymbro_exercise_ids": (string)[],"p_routine_id": string }; Returns: string[]
                           },
"apply_for_trainer":
{ Args: { "p_message"?: string }; Returns: {
              "applicant_id": string,
"created_at": string,
"id": string,
"message": string | null,
"response_message": string | null,
"reviewed_at": string | null,
"reviewed_by": string | null,
"status": Database["public"]['Enums']["trainer_application_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_applications"
        isOneToOne: true
        isSetofReturn: false
      } },
"archive_split":
{ Args: { "p_id": string }; Returns: undefined
                           },
"clone_split_for_user":
{ Args: { "p_name"?: string,"p_source_split_id": string,"p_target_user_id": string }; Returns: string
                           },
"create_routine":
{ Args: { "p_color": string,"p_name": string,"p_split_id"?: string }; Returns: {
              "color": string,"id": string,"name": string,"quantity": number,"split_id": string,"tags": (string)[]
            }[]
                           },
"create_split":
{ Args: { "p_name": string }; Returns: string
                           },
"decline_trainer_assignment":
{ Args: { "p_assignment_id": string }; Returns: {
              "created_at": string,
"gymbro_id": string,
"id": string,
"imported_split_id": string | null,
"responded_at": string | null,
"split_id": string,
"status": Database["public"]['Enums']["assignment_status"],
"trainer_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_assignments"
        isOneToOne: true
        isSetofReturn: false
      } },
"delete_routine":
{ Args: { "p_id": string }; Returns: string
                           },
"delete_routine_exercise":
{ Args: { "p_id": string }; Returns: string
                           },
"duplicate_split":
{ Args: { "p_id": string,"p_name": string }; Returns: string
                           },
"ensure_default_split":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"finish_workout":
{ Args: { "p_workout_id": string }; Returns: {
              "created_at": string,
"finished_at": string | null,
"id": string,
"routine_id": string | null,
"started_at": string,
"updated_at": string,
"user_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "workouts"
        isOneToOne: true
        isSetofReturn: false
      } },
"get_exercise":
{ Args: { "p_id": string,"p_language"?: string }; Returns: {
              "category": string,"equipment": string,"exercise_id": string,"gif_url": string,"id": string,"image": string,"instructions": string,"muscle_group": string,"name": string,"target": string
            }[]
                           },
"get_exercise_filters":
{ Args: { "p_language"?: string }; Returns: Json
                           },
"get_exercises":
{ Args: { "p_category_id"?: string,"p_equipment_id"?: string,"p_language": string,"p_limit"?: number,"p_muscle_group_id"?: string,"p_offset"?: number,"p_search"?: string,"p_target_id"?: string }; Returns: {
              "category": string,"equipment": string,"gif_url": string,"id": string,"image": string,"name": string,"target": string
            }[]
                           },
"get_gymbro_requests":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string,"created_at": string,"direction": string,"first_name": string,"friendship_id": string,"id": string,"last_name": string,"user_name": string
            }[]
                           },
"get_gymbros":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string,"first_name": string,"id": string,"last_name": string,"user_name": string
            }[]
                           },
"get_or_create_default_split":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"get_profile":
{ Args: { "p_user_id": string }; Returns: {
              "avatar_url": string,"bio": string,"can_view_full": boolean,"first_name": string,"friendship_id": string,"id": string,"is_self": boolean,"last_name": string,"relation": string,"user_name": string
            }[]
                           },
"get_profile_routines":
{ Args: { "p_language"?: string,"p_user_id": string }; Returns: {
              "color": string,"id": string,"name": string,"quantity": number,"split_id": string,"split_name": string,"tags": (string)[]
            }[]
                           },
"get_routine_exercises":
{ Args: { "p_language"?: string,"p_routine_id": string }; Returns: {
              "gymbro_exercise_id": string,"id": string,"image": string,"muscle_group": string,"name": string,"position": number,"sets": Json
            }[]
                           },
"get_routines":
{ Args: { "p_language"?: string }; Returns: {
              "color": string,"id": string,"name": string,"quantity": number,"split_id": string,"tags": (string)[]
            }[]
                           },
"get_shared_routine":
{ Args: { "p_routine_id": string }; Returns: {
              "color": string,"id": string,"name": string,"owner_avatar_url": string,"owner_first_name": string,"owner_id": string,"owner_last_name": string,"owner_user_name": string,"quantity": number
            }[]
                           },
"get_shared_routine_exercises":
{ Args: { "p_language"?: string,"p_routine_id": string }; Returns: {
              "gymbro_exercise_id": string,"id": string,"image": string,"muscle_group": string,"name": string,"position": number,"sets": Json
            }[]
                           },
"get_splits":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"id": string,"is_active": boolean,"name": string,"privacy": string,"routines": number
            }[]
                           },
"get_workout_exercises":
{ Args: { "p_language"?: string,"p_workout_id": string }; Returns: {
              "equipment": string,"gif_url": string,"gymbro_exercise_id": string,"id": string,"image": string,"muscle_group": string,"name": string,"position": number,"sets": Json
            }[]
                           },
"gymbro_relation":
{ Args: { "p_other": string,"p_viewer": string }; Returns: string
                           },
"import_routine":
{ Args: { "p_name"?: string,"p_source_routine_id": string,"p_target_split_id": string }; Returns: string
                           },
"import_split":
{ Args: { "p_name"?: string,"p_source_split_id": string }; Returns: string
                           },
"move_routine_to_split":
{ Args: { "p_routine_id": string,"p_split_id": string }; Returns: undefined
                           },
"remove_gymbro":
{ Args: { "p_user_id": string }; Returns: undefined
                           },
"rename_split":
{ Args: { "p_id": string,"p_name": string }; Returns: undefined
                           },
"reorder_routine_exercises":
{ Args: { "p_ids": (string)[],"p_routine_id": string }; Returns: undefined
                           },
"replace_routine_exercise_sets":
{ Args: { "p_routine_exercise_id": string,"p_sets": Json }; Returns: {
              "id": string,"max_reps": number,"min_reps": number,"position": number,"weight": number
            }[]
                           },
"respond_to_friendship":
{ Args: { "p_friendship_id": string,"p_status": Database["public"]['Enums']["friendship_status"] }; Returns: {
              "addressee_id": string,
"created_at": string,
"id": string,
"requester_id": string,
"status": Database["public"]['Enums']["friendship_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "friendships"
        isOneToOne: true
        isSetofReturn: false
      } },
"respond_to_trainer_request":
{ Args: { "p_relationship_id": string,"p_status": Database["public"]['Enums']["trainer_gymbro_status"] }; Returns: {
              "created_at": string,
"gymbro_id": string,
"id": string,
"status": Database["public"]['Enums']["trainer_gymbro_status"],
"trainer_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_gymbros"
        isOneToOne: true
        isSetofReturn: false
      } },
"review_trainer_application":
{ Args: { "p_application_id": string,"p_approve": boolean,"p_response_message"?: string }; Returns: {
              "applicant_id": string,
"created_at": string,
"id": string,
"message": string | null,
"response_message": string | null,
"reviewed_at": string | null,
"reviewed_by": string | null,
"status": Database["public"]['Enums']["trainer_application_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_applications"
        isOneToOne: true
        isSetofReturn: false
      } },
"revoke_trainer_assignment":
{ Args: { "p_assignment_id": string }; Returns: {
              "created_at": string,
"gymbro_id": string,
"id": string,
"imported_split_id": string | null,
"responded_at": string | null,
"split_id": string,
"status": Database["public"]['Enums']["assignment_status"],
"trainer_id": string,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_assignments"
        isOneToOne: true
        isSetofReturn: false
      } },
"search_profiles":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query": string }; Returns: {
              "avatar_url": string,"first_name": string,"id": string,"last_name": string,"relation": string,"user_name": string
            }[]
                           },
"send_gymbro_request":
{ Args: { "p_user_id": string }; Returns: string
                           },
"set_active_split":
{ Args: { "p_id": string }; Returns: undefined
                           },
"set_split_privacy":
{ Args: { "p_id": string,"p_privacy": Database["public"]['Enums']["profile_privacy"] }; Returns: undefined
                           },
"start_workout":
{ Args: { "p_routine_id": string }; Returns: string
                           },
"update_routine":
{ Args: { "p_color": string,"p_id": string,"p_name": string }; Returns: {
              "color": string,"id": string,"name": string,"quantity": number,"split_id": string,"tags": (string)[]
            }[]
                           },
"withdraw_trainer_application":
{ Args: { "p_application_id": string }; Returns: {
              "applicant_id": string,
"created_at": string,
"id": string,
"message": string | null,
"response_message": string | null,
"reviewed_at": string | null,
"reviewed_by": string | null,
"status": Database["public"]['Enums']["trainer_application_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "trainer_applications"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "app_role": "trainer"|"admin","assignment_status": "pending"|"accepted"|"declined"|"revoked","friendship_status": "pending"|"accepted"|"rejected"|"blocked","profile_privacy": "public"|"gymbros"|"private","trainer_application_status": "pending"|"approved"|"rejected"|"withdrawn","trainer_gymbro_status": "pending"|"active"|"declined"|"ended"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "app_role": ["trainer", "admin"],"assignment_status": ["pending", "accepted", "declined", "revoked"],"friendship_status": ["pending", "accepted", "rejected", "blocked"],"profile_privacy": ["public", "gymbros", "private"],"trainer_application_status": ["pending", "approved", "rejected", "withdrawn"],"trainer_gymbro_status": ["pending", "active", "declined", "ended"]
          }
        }
} as const
