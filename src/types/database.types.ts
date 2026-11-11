export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          restaurant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          restaurant_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          restaurant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          restaurant_id: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          restaurant_id: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_label: string | null
          address_line: string | null
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          customer_id: string | null
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          phone_number: string | null
          postal_code: string
          recipient_name: string
          recipient_phone: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_label?: string | null
          address_line?: string | null
          address_line1: string
          address_line2?: string | null
          city?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone_number?: string | null
          postal_code: string
          recipient_name: string
          recipient_phone: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_label?: string | null
          address_line?: string | null
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone_number?: string | null
          postal_code?: string
          recipient_name?: string
          recipient_phone?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          product_id: string | null
          restaurant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          restaurant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          product_id?: string | null
          restaurant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          order_id: string | null
          restaurant_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_read?: boolean
          message: string
          notification_type?: string
          order_id?: string | null
          restaurant_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          order_id?: string | null
          restaurant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          profile_image: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          profile_image?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          profile_image?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_reviews: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string
          product_id: string | null
          rating: number
          restaurant_id: string
          review_text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          product_id?: string | null
          rating: number
          restaurant_id: string
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          product_id?: string | null
          rating?: number
          restaurant_id?: string
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_reward_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string | null
          points_delta: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          points_delta: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          points_delta?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_reward_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_rewards: {
        Row: {
          created_at: string
          id: string
          lifetime_points: number
          points_balance: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_points?: number
          points_balance?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string | null
          priority: string
          resolution_notes: string | null
          restaurant_id: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id?: string | null
          priority?: string
          resolution_notes?: string | null
          restaurant_id?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string | null
          priority?: string
          resolution_notes?: string | null
          restaurant_id?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_support_tickets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          favorite_item: string | null
          id: string
          last_visit_at: string | null
          loyalty_points: number
          name: string
          phone: string | null
          restaurant_id: string
          tier: string
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          favorite_item?: string | null
          id?: string
          last_visit_at?: string | null
          loyalty_points?: number
          name: string
          phone?: string | null
          restaurant_id: string
          tier?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          favorite_item?: string | null
          id?: string
          last_visit_at?: string | null
          loyalty_points?: number
          name?: string
          phone?: string | null
          restaurant_id?: string
          tier?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          available_stock: number
          category: string
          cost_per_unit: number
          created_at: string
          id: string
          last_restocked_at: string | null
          min_stock: number
          name: string
          restaurant_id: string
          status: string
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          available_stock?: number
          category?: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          last_restocked_at?: string | null
          min_stock?: number
          name: string
          restaurant_id: string
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          available_stock?: number
          category?: string
          cost_per_unit?: number
          created_at?: string
          id?: string
          last_restocked_at?: string | null
          min_stock?: number
          name?: string
          restaurant_id?: string
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          restaurant_id: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          restaurant_id: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          restaurant_id?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          is_veg_snapshot: boolean
          item_total: number
          order_id: string
          price_snapshot: number
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          selected_options_snapshot: Json | null
          special_instructions: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_veg_snapshot?: boolean
          item_total: number
          order_id: string
          price_snapshot: number
          product_id?: string | null
          product_name_snapshot: string
          quantity?: number
          selected_options_snapshot?: Json | null
          special_instructions?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_veg_snapshot?: boolean
          item_total?: number
          order_id?: string
          price_snapshot?: number
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          selected_options_snapshot?: Json | null
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string | null
          delivery_address: string | null
          discount: number
          discount_amount: number | null
          estimated_ready_at: string | null
          id: string
          idempotency_key: string | null
          is_priority: boolean | null
          notes: string | null
          order_number: string
          order_status: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          prep_started_at: string | null
          prep_time_minutes: number | null
          priority_reason: string | null
          ready_at: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_id: string | null
          table_number_snapshot: string | null
          tax: number
          tax_amount: number | null
          total: number
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          discount?: number
          discount_amount?: number | null
          estimated_ready_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_priority?: boolean | null
          notes?: string | null
          order_number: string
          order_status?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          prep_started_at?: string | null
          prep_time_minutes?: number | null
          priority_reason?: string | null
          ready_at?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_number_snapshot?: string | null
          tax?: number
          tax_amount?: number | null
          total?: number
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          discount?: number
          discount_amount?: number | null
          estimated_ready_at?: string | null
          id?: string
          idempotency_key?: string | null
          is_priority?: boolean | null
          notes?: string | null
          order_number?: string
          order_status?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          prep_started_at?: string | null
          prep_time_minutes?: number | null
          priority_reason?: string | null
          ready_at?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_id?: string | null
          table_number_snapshot?: string | null
          tax?: number
          tax_amount?: number | null
          total?: number
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          restaurant_id: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          restaurant_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_support_tickets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          created_at: string
          group_title: string
          id: string
          max_select: number
          option_name: string
          price: number
          product_id: string
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_title: string
          id?: string
          max_select?: number
          option_name: string
          price?: number
          product_id: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_title?: string
          id?: string
          max_select?: number
          option_name?: string
          price?: number
          product_id?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          price_adjustment: number
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          price_adjustment?: number
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          price_adjustment?: number
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calories: number | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_bestseller: boolean
          is_veg: boolean
          name: string
          original_price: number | null
          prep_time_minutes: number
          price: number
          rating: number
          restaurant_id: string
          review_count: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          calories?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_bestseller?: boolean
          is_veg?: boolean
          name: string
          original_price?: number | null
          prep_time_minutes?: number
          price?: number
          rating?: number
          restaurant_id: string
          review_count?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          calories?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_bestseller?: boolean
          is_veg?: boolean
          name?: string
          original_price?: number | null
          prep_time_minutes?: number
          price?: number
          rating?: number
          restaurant_id?: string
          review_count?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          quantity_required: number
          recipe_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          quantity_required?: number
          recipe_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          quantity_required?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          prep_instructions: string | null
          product_id: string
          restaurant_id: string
          updated_at: string
          yield_servings: number
        }
        Insert: {
          created_at?: string
          id?: string
          prep_instructions?: string | null
          product_id: string
          restaurant_id: string
          updated_at?: string
          yield_servings?: number
        }
        Update: {
          created_at?: string
          id?: string
          prep_instructions?: string | null
          product_id?: string
          restaurant_id?: string
          updated_at?: string
          yield_servings?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          role: Database["public"]["Enums"]["restaurant_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["restaurant_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["restaurant_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_settings: {
        Row: {
          auto_accept_orders: boolean
          created_at: string
          id: string
          kds_chime_enabled: boolean
          low_stock_threshold_alert: boolean
          printer_ip: string | null
          receipt_footer: string | null
          receipt_header: string | null
          restaurant_id: string
          sound_volume: number
          tax_id_number: string | null
          updated_at: string
        }
        Insert: {
          auto_accept_orders?: boolean
          created_at?: string
          id?: string
          kds_chime_enabled?: boolean
          low_stock_threshold_alert?: boolean
          printer_ip?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          restaurant_id: string
          sound_volume?: number
          tax_id_number?: string | null
          updated_at?: string
        }
        Update: {
          auto_accept_orders?: boolean
          created_at?: string
          id?: string
          kds_chime_enabled?: boolean
          low_stock_threshold_alert?: boolean
          printer_ip?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          restaurant_id?: string
          sound_volume?: number
          tax_id_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          active_order_id: string | null
          capacity: number
          created_at: string
          guest_count: number | null
          id: string
          occupied_since: string | null
          restaurant_id: string
          section: string
          status: string
          table_number: string
          updated_at: string
        }
        Insert: {
          active_order_id?: string | null
          capacity?: number
          created_at?: string
          guest_count?: number | null
          id?: string
          occupied_since?: string | null
          restaurant_id: string
          section?: string
          status?: string
          table_number: string
          updated_at?: string
        }
        Update: {
          active_order_id?: string | null
          capacity?: number
          created_at?: string
          guest_count?: number | null
          id?: string
          occupied_since?: string | null
          restaurant_id?: string
          section?: string
          status?: string
          table_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          cuisine: string | null
          currency: string
          currency_symbol: string
          delivery_available: boolean
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          opening_hours: string | null
          rating: number
          slug: string
          tagline: string | null
          takeaway_available: boolean
          tax_percentage: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cuisine?: string | null
          currency?: string
          currency_symbol?: string
          delivery_available?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          opening_hours?: string | null
          rating?: number
          slug: string
          tagline?: string | null
          takeaway_available?: boolean
          tax_percentage?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cuisine?: string | null
          currency?: string
          currency_symbol?: string
          delivery_available?: boolean
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          rating?: number
          slug?: string
          tagline?: string | null
          takeaway_available?: boolean
          tax_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          description: string | null
          id: string
          permission: string
          role: Database["public"]["Enums"]["restaurant_role"]
        }
        Insert: {
          description?: string | null
          id?: string
          permission: string
          role: Database["public"]["Enums"]["restaurant_role"]
        }
        Update: {
          description?: string | null
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["restaurant_role"]
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          movement_type: string
          new_stock: number
          performed_by: string | null
          previous_stock: number
          quantity: number
          reason: string | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          movement_type: string
          new_stock: number
          performed_by?: string | null
          previous_stock: number
          quantity: number
          reason?: string | null
          restaurant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          movement_type?: string
          new_stock?: number
          performed_by?: string | null
          previous_stock?: number
          quantity?: number
          reason?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          has_analytics: boolean
          has_inventory: boolean
          has_kds: boolean
          has_loyalty: boolean
          id: string
          is_active: boolean
          max_orders_per_month: number
          max_terminals: number
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_analytics?: boolean
          has_inventory?: boolean
          has_kds?: boolean
          has_loyalty?: boolean
          id?: string
          is_active?: boolean
          max_orders_per_month?: number
          max_terminals?: number
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_analytics?: boolean
          has_inventory?: boolean
          has_kds?: boolean
          has_loyalty?: boolean
          id?: string
          is_active?: boolean
          max_orders_per_month?: number
          max_terminals?: number
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          restaurant_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_subscription_plan: {
        Args: {
          p_duration_months?: number
          p_plan_id: string
          p_restaurant_id: string
          p_status?: string
        }
        Returns: Json
      }
      create_restaurant_workspace: {
        Args: {
          p_address?: string
          p_city?: string
          p_close_time?: string
          p_country?: string
          p_cuisine?: string
          p_currency?: string
          p_currency_symbol?: string
          p_email?: string
          p_logo_url?: string
          p_name: string
          p_open_time?: string
          p_phone?: string
          p_postal_code?: string
          p_slug: string
          p_state?: string
          p_tax_number?: string
          p_tax_percentage?: number
        }
        Returns: Json
      }
      generate_order_number: {
        Args: { p_restaurant_id: string }
        Returns: string
      }
      get_platform_overview: { Args: never; Returns: Json }
      get_platform_tenants: { Args: never; Returns: Json }
      get_user_restaurant_role: {
        Args: { restaurant_uuid: string }
        Returns: string
      }
      get_user_workspaces: {
        Args: never
        Returns: {
          currency: string
          currency_symbol: string
          is_active: boolean
          member_status: string
          restaurant_cuisine: string
          restaurant_id: string
          restaurant_logo_url: string
          restaurant_name: string
          restaurant_slug: string
          tax_percentage: number
          user_role: string
        }[]
      }
      initialize_customer_rewards: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          id: string
          lifetime_points: number
          points_balance: number
          tier: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "customer_rewards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_restaurant_manager_or_owner: {
        Args: { restaurant_uuid: string }
        Returns: boolean
      }
      is_restaurant_member: {
        Args: { restaurant_uuid: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      process_customer_order:
        | {
            Args: {
              p_customer_id?: string
              p_customer_name: string
              p_customer_phone?: string
              p_delivery_address?: string
              p_idempotency_key?: string
              p_items?: Json
              p_notes?: string
              p_order_type?: Database["public"]["Enums"]["order_type"]
              p_payment_method?: Database["public"]["Enums"]["payment_method"]
              p_promo_code?: string
              p_restaurant_id: string
              p_table_id?: string
              p_table_number?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_customer_name: string
              p_customer_phone: string
              p_delivery_address?: string
              p_idempotency_key?: string
              p_items?: Json
              p_notes?: string
              p_order_type: Database["public"]["Enums"]["order_type"]
              p_payment_method?: Database["public"]["Enums"]["payment_method"]
              p_promo_code?: string
              p_restaurant_id: string
              p_table_id?: string
              p_table_number?: string
            }
            Returns: Json
          }
      process_order_refund: {
        Args: { p_order_id: string; p_reason: string; p_refund_amount: number }
        Returns: Json
      }
      record_failed_payment: {
        Args: {
          p_metadata?: Json
          p_order_id: string
          p_payment_reference: string
          p_reason: string
        }
        Returns: Json
      }
      record_verified_payment: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_method: Database["public"]["Enums"]["payment_method"]
          p_order_id: string
          p_payment_reference: string
        }
        Returns: Json
      }
      toggle_order_priority: {
        Args: { p_is_priority: boolean; p_order_id: string; p_reason?: string }
        Returns: Json
      }
      toggle_tenant_status: {
        Args: { p_is_active: boolean; p_restaurant_id: string }
        Returns: Json
      }
      transition_order_status: {
        Args: {
          p_is_staff?: boolean
          p_next_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
          p_reason?: string
        }
        Returns: Json
      }
      update_plan_config: {
        Args: {
          p_has_analytics: boolean
          p_has_inventory: boolean
          p_has_kds: boolean
          p_has_loyalty: boolean
          p_max_orders: number
          p_max_terminals: number
          p_plan_id: string
          p_price_monthly: number
          p_price_yearly: number
        }
        Returns: Json
      }
    }
    Enums: {
      member_status: "active" | "invited" | "suspended"
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
      order_type: "dine-in" | "takeaway" | "delivery"
      payment_method: "card" | "upi" | "cash" | "paypal" | "counter"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      restaurant_role: "owner" | "manager" | "cashier" | "kitchen" | "server"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      member_status: ["active", "invited", "suspended"],
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      order_type: ["dine-in", "takeaway", "delivery"],
      payment_method: ["card", "upi", "cash", "paypal", "counter"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      restaurant_role: ["owner", "manager", "cashier", "kitchen", "server"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "expired",
      ],
    },
  },
} as const
