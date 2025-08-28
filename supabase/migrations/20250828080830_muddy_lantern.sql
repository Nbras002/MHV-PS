@@ .. @@
   details text NOT NULL,
   timestamp timestamptz DEFAULT now(),
-  ip text,
-  user_agent text
+  ip text
 );