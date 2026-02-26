<?php

namespace Tests\Unit\Services;

use App\Services\SequenceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SequenceServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_generates_sequential_numbers_for_entity()
    {
        $seq1 = SequenceService::next('test_entity', 1, 'TST');
        $seq2 = SequenceService::next('test_entity', 1, 'TST');

        $date = now()->format('Ymd');
        $this->assertEquals("TST-{$date}-00001", $seq1);
        $this->assertEquals("TST-{$date}-00002", $seq2);
    }

    public function test_it_isolates_sequences_by_location()
    {
        $seqLoc1 = SequenceService::next('test_entity', 1, 'TST');
        $seqLoc2 = SequenceService::next('test_entity', 2, 'TST');

        $date = now()->format('Ymd');
        $this->assertEquals("TST-{$date}-00001", $seqLoc1);
        $this->assertEquals("TST-{$date}-00001", $seqLoc2); // Location 2 gets its own 00001
    }

    public function test_it_supports_global_sequences_with_null_location()
    {
        $seq1 = SequenceService::next('test_global', null, 'GLB');
        $seq2 = SequenceService::next('test_global', null, 'GLB');

        $date = now()->format('Ymd');
        $this->assertEquals("GLB-{$date}-00001", $seq1);
        $this->assertEquals("GLB-{$date}-00002", $seq2);
    }
}
