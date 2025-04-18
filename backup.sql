

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Answers" (
    "id" bigint NOT NULL,
    "questionsId" bigint,
    "answerText" "text" DEFAULT 'No answer text'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Answers" OWNER TO "postgres";


ALTER TABLE "public"."Answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Categories" (
    "id" bigint NOT NULL,
    "categoryName" "text" DEFAULT 'No category name'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "categoryDescription" "text"
);


ALTER TABLE "public"."Categories" OWNER TO "postgres";


ALTER TABLE "public"."Categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Product_Answers" (
    "id" bigint NOT NULL,
    "productId" bigint,
    "answerId" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."Product_Answers" OWNER TO "postgres";


ALTER TABLE "public"."Product_Answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Product_Answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Products" (
    "id" bigint NOT NULL,
    "productName" "text" DEFAULT 'No product name'::"text",
    "productDescription" "text" DEFAULT 'No product description'::"text",
    "productImage" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lastUpdated" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."Products" OWNER TO "postgres";


ALTER TABLE "public"."Products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."Questions" (
    "id" bigint NOT NULL,
    "questionText" "text" DEFAULT 'No question text'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "categoryId" bigint
);


ALTER TABLE "public"."Questions" OWNER TO "postgres";


ALTER TABLE "public"."Questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."Questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."Answers"
    ADD CONSTRAINT "Answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Categories"
    ADD CONSTRAINT "Categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Product_Answers"
    ADD CONSTRAINT "Product_Answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Questions"
    ADD CONSTRAINT "Questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Answers"
    ADD CONSTRAINT "Answers_questionsId_fkey" FOREIGN KEY ("questionsId") REFERENCES "public"."Questions"("id");



ALTER TABLE ONLY "public"."Product_Answers"
    ADD CONSTRAINT "Product_Answers_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "public"."Answers"("id");



ALTER TABLE ONLY "public"."Product_Answers"
    ADD CONSTRAINT "Product_Answers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Products"("id");



ALTER TABLE ONLY "public"."Questions"
    ADD CONSTRAINT "Questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Categories"("id");



CREATE POLICY "Allow authenticated users to delete products" ON "public"."Products" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert products" ON "public"."Products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update products" ON "public"."Products" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow public read on Answers" ON "public"."Answers" FOR SELECT USING (true);



CREATE POLICY "Allow public read on Categories" ON "public"."Categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read on Product_Answers" ON "public"."Product_Answers" FOR SELECT USING (true);



CREATE POLICY "Allow public read on Products" ON "public"."Products" FOR SELECT USING (true);



CREATE POLICY "Allow public read on Questions" ON "public"."Questions" FOR SELECT USING (true);



CREATE POLICY "Allow read access to Products" ON "public"."Products" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."Answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Product_Answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."Questions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Answers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Categories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Product_Answers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Products";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."Questions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."Answers" TO "anon";
GRANT ALL ON TABLE "public"."Answers" TO "authenticated";
GRANT ALL ON TABLE "public"."Answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Categories" TO "anon";
GRANT ALL ON TABLE "public"."Categories" TO "authenticated";
GRANT ALL ON TABLE "public"."Categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Product_Answers" TO "anon";
GRANT ALL ON TABLE "public"."Product_Answers" TO "authenticated";
GRANT ALL ON TABLE "public"."Product_Answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Product_Answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Product_Answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Product_Answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Products" TO "anon";
GRANT ALL ON TABLE "public"."Products" TO "authenticated";
GRANT ALL ON TABLE "public"."Products" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."Questions" TO "anon";
GRANT ALL ON TABLE "public"."Questions" TO "authenticated";
GRANT ALL ON TABLE "public"."Questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."Questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."Questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."Questions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
