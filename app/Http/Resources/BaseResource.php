<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class BaseResource extends JsonResource
{
    protected function transformDate($date)
    {
        return $date ? $date->format('Y-m-d H:i:s') : null;
    }

    protected function whenLoadedCount($relation)
    {
        return $this->when(
            $this->resource->relationLoaded($relation), 
            fn() => $this->resource->{$relation . '_count'} ?? 0
        );
    }
}