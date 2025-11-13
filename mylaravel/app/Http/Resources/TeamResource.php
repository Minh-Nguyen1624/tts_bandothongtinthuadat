<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
{
    public function toArray($request){
         return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code ?? null,
            'unit_code' => $this->unit->code ?? null, // Trả về unit_code
            'description' => $this->description,
            'status' => $this->status,
            'unit' => $this->whenLoaded('unit')
        ];
    }
}