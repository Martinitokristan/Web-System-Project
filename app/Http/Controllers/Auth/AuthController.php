<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100',
            'email'        => 'required|email|unique:users,email',
            'phone'        => 'required|string|max:20',
            'password'     => 'required|string|min:8|confirmed',
            'age'          => 'nullable|integer|min:1|max:120',
            'sex'          => 'nullable|in:male,female,other',
            'province'     => 'required|string|max:100',
            'municipality' => 'required|string|max:100',
            'zip_code'     => 'required|string|max:10',
            'address'      => 'required|string|max:255',
            'landmark'     => 'nullable|string|max:100',
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
        ]);

        $user = \DB::transaction(function () use ($request) {
            $user = User::create([
                'name'     => $request->name,
                'email'    => $request->email,
                'phone'    => $request->phone,
                'role'     => 'customer',
                'status'   => 'active',
                'password' => Hash::make($request->password),
            ]);

            \App\Models\CustomerProfile::create([
                'user_id'      => $user->id,
                'age'          => $request->age,
                'sex'          => $request->sex,
                'province'     => $request->province,
                'municipality' => $request->municipality,
                'zip_code'     => $request->zip_code,
                'address'      => $request->address,
                'landmark'     => $request->landmark,
                'latitude'     => $request->latitude,
                'longitude'    => $request->longitude,
            ]);

            return $user;
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data'    => $user,
            'token'   => $token,
            'message' => 'Registration successful',
            'status'  => 'success',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
            'role'     => 'nullable|string|in:admin,rider,customer',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // RBAC: Check if user has the required role for this login portal
        if ($request->role && $user->role !== $request->role) {
            return response()->json([
                'message' => 'Unauthorized. You do not have the required permissions for this area.',
                'status'  => 'error',
            ], 403);
        }

        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended.',
                'status'  => 'error',
            ], 403);
        }

        if ($user->role === 'rider') {
            \App\Models\RiderProfile::updateOrCreate(
                ['user_id' => $user->id],
                ['availability' => 'available']
            );
        }

        $user->update(['last_login_at' => now()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data'    => $user,
            'token'   => $token,
            'message' => 'Login successful',
            'status'  => 'success',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
            'status'  => 'success',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'data'   => $request->user()->load('riderProfile'),
            'status' => 'success',
        ]);
    }
}
