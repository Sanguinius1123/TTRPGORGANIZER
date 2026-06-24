export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      factions: {
        Row: {
          id: string
          name: string
          parent_faction_id: string | null
          disposition: string | null
          goal: string | null
          description: string | null
          image_url: string | null
          visible: boolean
          species: string | null
          culture: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['factions']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['factions']['Insert']>
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string | null
          type: string | null
          descriptor: string | null
          status: string | null
          area: string | null
          description: string | null
          parent_location_id: string | null
          image_url: string | null
          visible: boolean
          map_x: number | null
          map_y: number | null
          waypoint: boolean
          terrain: string | null
          path_modifiers: string[]
          has_submap: boolean
          mystery: boolean
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['locations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['locations']['Insert']>
        Relationships: []
      }
      location_connections: {
        Row: {
          id: string
          from_location_id: string
          to_location_id: string
          travel_time: string | null
          travel_cost: string | null
          bidirectional: boolean
          travel_time_manual: boolean
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['location_connections']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['location_connections']['Insert']>
        Relationships: []
      }
      map_configs: {
        Row: {
          id: string
          location_id: string | null
          map_scale: string | null
          travel_unit: string | null
          distance_scale: number
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['map_configs']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['map_configs']['Insert']>
        Relationships: []
      }
      player_characters: {
        Row: {
          id: string
          name: string
          player_name: string | null
          species: string | null
          culture: string | null
          background: string | null
          notes: string | null
          private_notes: string | null
          image_url: string | null
          visible: boolean
          current_location_id: string | null
          profile_id: string | null
          party_faction_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['player_characters']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['player_characters']['Insert']>
        Relationships: []
      }
      npcs: {
        Row: {
          id: string
          name: string
          species: string | null
          profession: string | null
          culture: string | null
          background: string | null
          disposition: string | null
          notes: string | null
          image_url: string | null
          visible: boolean
          current_location_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['npcs']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['npcs']['Insert']>
        Relationships: []
      }
      npc_facts: {
        Row: {
          id: string
          npc_id: string
          fact_text: string
          revealed: boolean
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['npc_facts']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['npc_facts']['Insert']>
        Relationships: []
      }
      npc_factions: {
        Row: {
          id: string
          npc_id: string
          faction_id: string
          role: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['npc_factions']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['npc_factions']['Insert']>
        Relationships: []
      }
      pc_factions: {
        Row: {
          id: string
          pc_id: string
          faction_id: string
          role: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['pc_factions']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['pc_factions']['Insert']>
        Relationships: []
      }
      npc_locations: {
        Row: {
          id: string
          npc_id: string
          location_id: string
          relationship_type: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['npc_locations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['npc_locations']['Insert']>
        Relationships: []
      }
      character_relationships: {
        Row: {
          id: string
          from_npc_id: string | null
          from_pc_id: string | null
          to_npc_id: string | null
          to_pc_id: string | null
          relationship_type: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['character_relationships']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['character_relationships']['Insert']>
        Relationships: []
      }
      items: {
        Row: {
          id: string
          name: string
          description: string | null
          base_price: number | null
          item_type: string | null
          descriptor: string | null
          location_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['items']['Insert']>
        Relationships: []
      }
      shops: {
        Row: {
          id: string
          name: string
          location_id: string
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['shops']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['shops']['Insert']>
        Relationships: []
      }
      shop_inventory: {
        Row: {
          id: string
          shop_id: string
          item_id: string
          price_override: number | null
          available: boolean
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['shop_inventory']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['shop_inventory']['Insert']>
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          session_number: number
          title: string | null
          summary: string | null
          loose_threads: string | null
          faction_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>
        Relationships: []
      }
      encounters: {
        Row: {
          id: string
          title: string
          location_id: string | null
          status: string
          summary: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['encounters']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['encounters']['Insert']>
        Relationships: []
      }
      session_encounters: {
        Row: {
          id: string
          session_id: string
          encounter_id: string
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['session_encounters']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['session_encounters']['Insert']>
        Relationships: []
      }
      encounter_participants: {
        Row: {
          id: string
          encounter_id: string
          npc_id: string | null
          label: string
          count: number
          role: string | null
          dr: number | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['encounter_participants']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['encounter_participants']['Insert']>
        Relationships: []
      }
      lore_entries: {
        Row: {
          id: string
          title: string
          category: string | null
          descriptor: string | null
          description: string | null
          visible: boolean
          major_event: boolean
          event_timestamp: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['lore_entries']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['lore_entries']['Insert']>
        Relationships: []
      }
      lore_locations: {
        Row: {
          id: string
          lore_id: string
          location_id: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['lore_locations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['lore_locations']['Insert']>
        Relationships: []
      }
      plot_threads: {
        Row: {
          id: string
          title: string
          type: string
          description: string | null
          status: string
          notes: string | null
          parent_id: string | null
          visible: boolean
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['plot_threads']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['plot_threads']['Insert']>
        Relationships: []
      }
      species: {
        Row: {
          id: string
          name: string
          description: string | null
          origin_location_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['species']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['species']['Insert']>
        Relationships: []
      }
      cultures: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['cultures']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['cultures']['Insert']>
        Relationships: []
      }
      culture_locations: {
        Row: {
          id: string
          culture_id: string
          location_id: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['culture_locations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['culture_locations']['Insert']>
        Relationships: []
      }
      session_plot_threads: {
        Row: {
          id: string
          session_id: string
          plot_thread_id: string
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['session_plot_threads']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['session_plot_threads']['Insert']>
        Relationships: []
      }
      session_notes: {
        Row: {
          id: string
          session_id: string
          pc_id: string | null
          profile_id: string | null
          author_name: string | null
          notes_text: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['session_notes']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['session_notes']['Insert']>
        Relationships: []
      }
      faction_relationships: {
        Row: {
          id: string
          from_faction_id: string
          to_faction_id: string
          relationship_type: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['faction_relationships']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['faction_relationships']['Insert']>
        Relationships: []
      }
      faction_locations: {
        Row: {
          id: string
          faction_id: string
          location_id: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['faction_locations']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['faction_locations']['Insert']>
        Relationships: []
      }
      plot_thread_factions: {
        Row: {
          id: string
          plot_thread_id: string
          faction_id: string
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['plot_thread_factions']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['plot_thread_factions']['Insert']>
        Relationships: []
      }
      plot_thread_characters: {
        Row: {
          id: string
          plot_thread_id: string
          pc_id: string | null
          npc_id: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['plot_thread_characters']['Row'], 'id' | 'created_at'>>
        Update: Partial<Database['public']['Tables']['plot_thread_characters']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
        }
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: { key: string; value?: string | null }
        Update: { key?: string; value?: string | null }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Faction            = Tables<'factions'>
export type Location           = Tables<'locations'>
export type LocationConnection = Tables<'location_connections'>
export type MapConfig          = Tables<'map_configs'>
export type PlayerCharacter    = Tables<'player_characters'>
export type NPC                = Tables<'npcs'>
export type NPCFact            = Tables<'npc_facts'>
export type NPCFaction         = Tables<'npc_factions'>
export type PCFaction          = Tables<'pc_factions'>
export type NPCLocation        = Tables<'npc_locations'>
export type CharacterRelationship = Tables<'character_relationships'>
export type Item               = Tables<'items'>
export type Shop               = Tables<'shops'>
export type ShopInventory      = Tables<'shop_inventory'>
export type Session            = Tables<'sessions'>
export type Encounter          = Tables<'encounters'>
export type EncounterParticipant = Tables<'encounter_participants'>
export type LoreEntry          = Tables<'lore_entries'>
export type LoreLocation       = Tables<'lore_locations'>
export type PlotThread         = Tables<'plot_threads'>
export type Species              = Tables<'species'>
export type Culture              = Tables<'cultures'>
export type FactionRelationship  = Tables<'faction_relationships'>
export type FactionLocation      = Tables<'faction_locations'>
export type CultureLocation      = Tables<'culture_locations'>
export type SessionNote          = Tables<'session_notes'>
export type SessionPlotThread    = Tables<'session_plot_threads'>
export type SessionEncounter      = Tables<'session_encounters'>
export type PlotThreadFaction     = Tables<'plot_thread_factions'>
export type PlotThreadCharacter   = Tables<'plot_thread_characters'>
export type Profile               = Tables<'profiles'>
export type Setting               = Tables<'settings'>
