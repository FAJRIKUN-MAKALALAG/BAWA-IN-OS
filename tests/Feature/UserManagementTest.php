<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->regularUser = User::factory()->create([
            'role' => 'user',
        ]);
    }

    /**
     * Memastikan Super Admin bisa melihat daftar pengguna.
     */
    public function test_super_admin_can_access_users_index(): void
    {
        $response = $this->actingAs($this->admin)->get(route('users.index'));

        $response->assertStatus(200);
    }

    /**
     * Memastikan user biasa diblokir dari melihat daftar pengguna.
     */
    public function test_regular_user_cannot_access_users_index(): void
    {
        $response = $this->actingAs($this->regularUser)->get(route('users.index'));

        $response->assertStatus(403);
    }

    /**
     * Memastikan Super Admin bisa mengubah role pengguna lain.
     */
    public function test_super_admin_can_update_user_role(): void
    {
        $targetUser = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($this->admin)->post(route('users.update-role', $targetUser->id), [
            'role' => 'financial_auditor',
        ]);

        $response->assertRedirect();
        $this->assertEquals('financial_auditor', $targetUser->fresh()->role);
    }

    /**
     * Memastikan Super Admin tidak bisa mengubah role akunnya sendiri.
     */
    public function test_super_admin_cannot_update_own_role(): void
    {
        $response = $this->actingAs($this->admin)->post(route('users.update-role', $this->admin->id), [
            'role' => 'user',
        ]);

        $response->assertSessionHasErrors('message');
        $this->assertEquals('super_admin', $this->admin->fresh()->role);
    }
}
