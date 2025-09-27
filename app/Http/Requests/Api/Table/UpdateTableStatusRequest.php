<?php

namespace App\Http\Requests\Api\Table;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTableStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => ['required','in:available,occupied,reserved'],
        ];
    }
}
