# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.core.** { *; }

# Android Credential Manager & Google ID
-keep class androidx.credentials.** { *; }
-keep class androidx.credentials.playservices.** { *; }
-keepnames class androidx.credentials.exceptions.**
-keep class com.google.android.libraries.identity.googleid.** { *; }
-keepnames class com.google.android.libraries.identity.googleid.**
-keep class com.swappios.GoogleCredentialModule { *; }
-keep class com.swappios.GoogleCredentialPackage { *; }
-keepclassmembers class com.swappios.GoogleCredentialModule {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Google Sign-In & Play Services Auth
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.** { *; }
-keep class com.reactnativegooglesignin.** { *; }

