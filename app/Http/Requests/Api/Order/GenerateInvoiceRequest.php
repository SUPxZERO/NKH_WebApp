<?php

namespace App\Http\Requests\Api\Order;

use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoiceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'payment_method_id' => ['required','exists:payment_methods,id'],
            'amount_paid' => ['required','numeric','min:0'],
        ];
    }
}
