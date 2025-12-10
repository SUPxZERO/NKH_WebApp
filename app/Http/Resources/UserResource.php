<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /** @var \App\Models\User */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'avatar' => $this->avatar_url,
            'image_path' => $this->image_path_url,
            'roles' => RoleResource::collection($this->whenLoaded('roles')),
        ];
    }
}
