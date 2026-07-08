<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TransactionPaidMail extends Mailable
{
    use Queueable, SerializesModels;

    public Transaction $transaction;
    public string $invoicePath;

    /**
     * Create a new message instance.
     */
    public function __construct(Transaction $transaction, string $invoicePath)
    {
        $this->transaction = $transaction;
        $this->invoicePath = $invoicePath;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Pembayaran Sukses - Invoice ' . $this->transaction->invoice_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $grossFormatted = number_format($this->transaction->gross_amount, 2, ',', '.');
        return new Content(
            htmlString: "Halo {$this->transaction->buyer->name},<br><br>" .
                        "Pembayaran Anda untuk invoice <strong>{$this->transaction->invoice_number}</strong> sebesar <strong>Rp {$grossFormatted}</strong> telah berhasil diterima.<br>" .
                        "Dana Anda aman disimpan di rekening bersama (escrow) Bawa.in sampai barang diverifikasi dan diterima.<br><br>" .
                        "Detail invoice terlampir pada email ini.<br><br>" .
                        "Salam,<br>Tim Bawa.in"
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->invoicePath)
                ->as("Invoice-" . str_replace('/', '-', $this->transaction->invoice_number) . ".txt")
                ->withMime('text/plain'),
        ];
    }
}
