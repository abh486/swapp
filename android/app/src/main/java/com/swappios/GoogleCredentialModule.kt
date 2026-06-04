package com.swappios

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.NoCredentialException
import androidx.credentials.CustomCredential
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class GoogleCredentialModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val credentialManager = CredentialManager.create(reactContext)
    private val mainScope = CoroutineScope(Dispatchers.Main)
    private var webClientId: String? = null

    override fun getName(): String {
        return "GoogleCredentialManager"
    }

    @ReactMethod
    fun configure(webClientId: String, promise: Promise) {
        this.webClientId = webClientId
        promise.resolve(true)
    }

    @ReactMethod
    fun signIn(hashedNonce: String, promise: Promise) {
        val clientId = webClientId
        if (clientId == null) {
            promise.reject("CONFIG_ERROR", "GoogleCredentialManager is not configured. Call configure(webClientId) first.")
            return
        }

        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NULL", "Activity is not available.")
            return
        }

        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(clientId)
            .setNonce(hashedNonce)
            .setAutoSelectEnabled(false)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        mainScope.launch {
            try {
                val result = credentialManager.getCredential(
                    context = activity,
                    request = request
                )
                val credential = result.credential
                if (credential is CustomCredential && 
                    credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        
                        Log.i("GoogleCredentialModule", "Successfully authenticated with Google Credential Manager.")
                        
                        val response: WritableMap = Arguments.createMap().apply {
                            putString("idToken", googleIdTokenCredential.idToken)
                            putString("email", googleIdTokenCredential.id)
                            putString("name", googleIdTokenCredential.displayName)
                            putString("photo", googleIdTokenCredential.profilePictureUri?.toString())
                        }
                        promise.resolve(response)
                    } catch (parsingException: GoogleIdTokenParsingException) {
                        Log.e("GoogleCredentialModule", "Failed to parse Google ID Token: ${parsingException.message}")
                        promise.reject("PARSING_ERROR", "Failed to parse Google ID Token credential", parsingException)
                    }
                } else {
                    Log.e("GoogleCredentialModule", "Received credential of unsupported type: ${credential.type}")
                    promise.reject("UNSUPPORTED_CREDENTIAL", "Received credential of unsupported type: ${credential.type}")
                }
            } catch (e: GetCredentialException) {
                val errorCode = when (e) {
                    is GetCredentialCancellationException -> "SIGN_IN_CANCELLED"
                    is NoCredentialException -> "NO_CREDENTIAL"
                    else -> "CREDENTIAL_ERROR"
                }
                if (errorCode != "SIGN_IN_CANCELLED") {
                    Log.e("GoogleCredentialModule", "Credential Manager error: ${e.message}")
                }
                promise.reject(errorCode, e.message, e)
            } catch (e: Exception) {
                Log.e("GoogleCredentialModule", "Unknown Exception in signIn: ${e.message}")
                promise.reject("UNKNOWN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun signOut(promise: Promise) {
        mainScope.launch {
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
                Log.i("GoogleCredentialModule", "Successfully cleared credential state.")
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e("GoogleCredentialModule", "Failed to clear credential state: ${e.message}")
                promise.reject("SIGNOUT_ERROR", e.message, e)
            }
        }
    }
}
